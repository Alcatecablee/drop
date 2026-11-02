import pg from 'pg'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is required.')
  process.exit(1)
}

const caCertPath = path.resolve('certs/supabase-root-ca.crt')
const ssl = fs.existsSync(caCertPath)
  ? { ca: fs.readFileSync(caCertPath, 'utf8'), rejectUnauthorized: true }
  : { rejectUnauthorized: true }

function createClient() {
  return new pg.Client({
    connectionString,
    ssl,
  })
}

async function runTests() {
  console.log('====================================================')
  console.log('DropYourSaaS Production Security & Integrity Test Suite')
  console.log('====================================================')

  const client = createClient()
  await client.connect()

  let passed = 0
  let failed = 0

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName}`)
      failed++
    }
  }

  try {
    // 1. DRAFT ISOLATION TESTS
    console.log('\n--- 1. Draft Isolation & Public View Tests ---')
    const totalProducts = await client.query('SELECT count(*) FROM public.products;')
    assert(totalProducts.rows[0].count === '20', 'Total staged candidate products in database === 20')

    const publicViewProducts = await client.query('SELECT count(*) FROM public.public_products;')
    assert(publicViewProducts.rows[0].count === '0', 'Public view (public_products) exposes 0 draft products')

    const draftStatuses = await client.query(`
      SELECT DISTINCT publication_status, verification_status, last_verified_at 
      FROM public.products;
    `)
    assert(
      draftStatuses.rows.length === 1 &&
        draftStatuses.rows[0].publication_status === 'draft' &&
        draftStatuses.rows[0].verification_status === 'unverified' &&
        draftStatuses.rows[0].last_verified_at === null,
      'All 20 candidates have publication_status=draft, verification_status=unverified, last_verified_at=NULL'
    )

    // 2. TAXONOMY ACTIVE FLAGS
    console.log('\n--- 2. Taxonomy Active Status Tests ---')
    const countries = await client.query('SELECT count(*) FROM public.countries WHERE is_active = true;')
    assert(countries.rows[0].count === '5', 'Active countries count === 5')

    const categories = await client.query('SELECT count(*) FROM public.categories WHERE is_active = true;')
    assert(categories.rows[0].count === '9', 'Active categories count === 9')

    // 3. RPC PRIVILEGE LOCKDOWN TESTS
    console.log('\n--- 3. RPC Privilege Lockdown Tests ---')
    const rpcSignature = 'public.submit_product_with_rate_limit(varchar, varchar, varchar, text, uuid, uuid, uuid[], public.pricing_model_enum, text, varchar, varchar, boolean, varchar, int, public.availability_scope_enum)'

    const anonPriv = await client.query(
      `SELECT has_function_privilege('anon', '${rpcSignature}', 'EXECUTE') AS has_priv;`
    )
    assert(anonPriv.rows[0].has_priv === false, 'RPC execution is revoked from "anon"')

    const authPriv = await client.query(
      `SELECT has_function_privilege('authenticated', '${rpcSignature}', 'EXECUTE') AS has_priv;`
    )
    assert(authPriv.rows[0].has_priv === false, 'RPC execution is revoked from "authenticated"')

    const servicePriv = await client.query(
      `SELECT has_function_privilege('service_role', '${rpcSignature}', 'EXECUTE') AS has_priv;`
    )
    assert(servicePriv.rows[0].has_priv === true, 'RPC execution is granted strictly to "service_role"')

    // 4. STORAGE-LEVEL UNIQUE CONSTRAINT ON PENDING DOMAINS
    console.log('\n--- 4. Partial Unique Index Verification ---')
    const indexRes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'submissions' AND indexname = 'idx_submissions_pending_clean_domain';
    `)
    assert(
      indexRes.rows.length === 1 && indexRes.rows[0].indexdef.includes('UNIQUE INDEX'),
      'Unique index "idx_submissions_pending_clean_domain" exists on submissions for pending status'
    )

    // Helper references
    const catRes = await client.query('SELECT id FROM public.categories LIMIT 1;')
    const countryRes = await client.query('SELECT id FROM public.countries LIMIT 1;')
    const catId = catRes.rows[0].id
    const countryId = countryRes.rows[0].id

    // 5. TRUE PARALLEL RATE LIMIT CONCURRENCY TEST (5 parallel requests, limit = 3)
    console.log('\n--- 5. True Parallel Rate Limit Concurrency Tests ---')
    const testIpHash = crypto.createHmac('sha256', 'concurrency_test_salt').update('192.168.200.50').digest('hex')
    await client.query('DELETE FROM public.submissions WHERE submitted_ip_hash = $1;', [testIpHash])

    const parallelClients = Array.from({ length: 5 }, () => createClient())
    await Promise.all(parallelClients.map((c) => c.connect()))

    const parallelResults = await Promise.all(
      parallelClients.map(async (c, i) => {
        try {
          const res = await c.query(
            `
            SELECT public.submit_product_with_rate_limit(
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 3
            );
          `,
            [
              `Concurrent Product ${i}`,
              `https://concurrent-${i}-${Date.now()}.co.za`,
              `Tagline ${i}`,
              `Description for concurrent product ${i}`,
              catId,
              countryId,
              [countryId],
              'free',
              'Free testing',
              'Concurrent Tester',
              'tester@example.com',
              true,
              testIpHash,
            ]
          )
          return { success: true, id: res.rows[0].submit_product_with_rate_limit }
        } catch (err) {
          return { success: false, error: err.message }
        }
      })
    )

    await Promise.all(parallelClients.map((c) => c.end()))

    const succeededCount = parallelResults.filter((r) => r.success).length
    const rateLimitedCount = parallelResults.filter(
      (r) => !r.success && r.error.includes('RATE_LIMIT_EXCEEDED')
    ).length

    assert(
      succeededCount === 3,
      `Exactly 3 of 5 concurrent submissions from same IP succeeded (Actual: ${succeededCount})`
    )
    assert(
      rateLimitedCount === 2,
      `Exactly 2 of 5 concurrent submissions blocked with RATE_LIMIT_EXCEEDED (Actual: ${rateLimitedCount})`
    )

    // 6. TRUE PARALLEL DOMAIN RACE CONDITION TEST (2 parallel requests, different IPs, same domain)
    console.log('\n--- 6. Domain-Level Concurrency Race Tests ---')
    const raceDomain = `race-test-${Date.now()}.co.za`
    const raceIp1 = crypto.randomBytes(16).toString('hex')
    const raceIp2 = crypto.randomBytes(16).toString('hex')

    const clientA = createClient()
    const clientB = createClient()
    await Promise.all([clientA.connect(), clientB.connect()])

    const raceResults = await Promise.all([
      clientA
        .query(
          `
        SELECT public.submit_product_with_rate_limit(
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10
        );
      `,
          [
            'Race Test App A',
            `https://${raceDomain}/app-a`,
            'Tagline',
            'Description',
            catId,
            countryId,
            [countryId],
            'free',
            null,
            'Tester A',
            'testerA@example.com',
            true,
            raceIp1,
          ]
        )
        .then((r) => ({ success: true, id: r.rows[0].submit_product_with_rate_limit }))
        .catch((err) => ({ success: false, error: err.message })),
      clientB
        .query(
          `
        SELECT public.submit_product_with_rate_limit(
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10
        );
      `,
          [
            'Race Test App B',
            `https://${raceDomain}/app-b`,
            'Tagline',
            'Description',
            catId,
            countryId,
            [countryId],
            'free',
            null,
            'Tester B',
            'testerB@example.com',
            true,
            raceIp2,
          ]
        )
        .then((r) => ({ success: true, id: r.rows[0].submit_product_with_rate_limit }))
        .catch((err) => ({ success: false, error: err.message })),
    ])

    await Promise.all([clientA.end(), clientB.end()])

    const raceSuccessCount = raceResults.filter((r) => r.success).length
    const raceBlockedCount = raceResults.filter(
      (r) =>
        !r.success &&
        (r.error.includes('DUPLICATE_SUBMISSION') || r.error.includes('duplicate key value'))
    ).length

    assert(
      raceSuccessCount === 1,
      `Exactly 1 of 2 concurrent submissions for the same domain succeeded (Actual: ${raceSuccessCount})`
    )
    assert(
      raceBlockedCount === 1,
      `The conflicting concurrent submission was blocked by domain lock / unique constraint (Actual: ${raceBlockedCount})`
    )

    // 7. DUPLICATE DOMAIN AGAINST CATALOG TEST
    console.log('\n--- 7. Duplicate Domain Detection Against Catalog Tests ---')
    let catalogDupBlocked = false
    try {
      await client.query(
        `
        SELECT public.submit_product_with_rate_limit(
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10
        );
      `,
        [
          'QuickBridge Catalog Duplicate Test',
          'https://quickbridge.app/new',
          'Tagline',
          'Description',
          catId,
          countryId,
          [countryId],
          'free',
          null,
          'Tester',
          'test@example.com',
          true,
          'random_ip_hash_' + Date.now(),
        ]
      )
    } catch (err) {
      if (err.message.includes('DUPLICATE_DOMAIN')) {
        catalogDupBlocked = true
      }
    }
    assert(
      catalogDupBlocked,
      'Submission for existing catalogue product (quickbridge.app) blocked with DUPLICATE_DOMAIN'
    )

    // 8. ACTIVE TAXONOMY ENFORCEMENT TESTS
    console.log('\n--- 8. Active Taxonomy Enforcement Tests ---')
    const fakeUuid = '00000000-0000-0000-0000-000000000000'

    let fakeCatBlocked = false
    try {
      await client.query(
        `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10);`,
        ['Taxonomy Test', `https://taxonomy-${Date.now()}.co.za`, 'Tag', 'Desc', fakeUuid, countryId, [countryId], 'free', null, 'T', 't@e.co', true, 'ip_tax_1']
      )
    } catch (err) {
      if (err.message.includes('INVALID_CATEGORY')) fakeCatBlocked = true
    }
    assert(fakeCatBlocked, 'Submission with non-existent or inactive category blocked with INVALID_CATEGORY')

    let fakeCountryBuiltBlocked = false
    try {
      await client.query(
        `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10);`,
        ['Taxonomy Test 2', `https://taxonomy-2-${Date.now()}.co.za`, 'Tag', 'Desc', catId, fakeUuid, [countryId], 'free', null, 'T', 't@e.co', true, 'ip_tax_2']
      )
    } catch (err) {
      if (err.message.includes('INVALID_COUNTRY_BUILT')) fakeCountryBuiltBlocked = true
    }
    assert(fakeCountryBuiltBlocked, 'Submission with non-existent or inactive origin country blocked with INVALID_COUNTRY_BUILT')

    let fakeCountryServedBlocked = false
    try {
      await client.query(
        `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10);`,
        ['Taxonomy Test 3', `https://taxonomy-3-${Date.now()}.co.za`, 'Tag', 'Desc', catId, countryId, [fakeUuid], 'free', null, 'T', 't@e.co', true, 'ip_tax_3']
      )
    } catch (err) {
      if (err.message.includes('INVALID_COUNTRY_SERVED')) fakeCountryServedBlocked = true
    }
    assert(fakeCountryServedBlocked, 'Submission with non-existent or inactive served country blocked with INVALID_COUNTRY_SERVED')

    let emptyServedBlocked = false
    try {
      await client.query(
        `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10);`,
        ['Taxonomy Test Empty', `https://taxonomy-empty-${Date.now()}.co.za`, 'Tag', 'Desc', catId, countryId, [], 'free', null, 'T', 't@e.co', true, 'ip_tax_4']
      )
    } catch (err) {
      if (err.message.includes('INVALID_COUNTRY_SERVED')) emptyServedBlocked = true
    }
    assert(emptyServedBlocked, 'Submission with empty served countries array ([]) blocked with INVALID_COUNTRY_SERVED via cardinality()')

    // 8b. AVAILABILITY SCOPE VALIDATION TESTS
    console.log('\n--- 8b. Availability Scope Validation Tests ---')
    const globalDomain = `https://global-test-${Date.now()}.org`
    const globalRes = await client.query(
      `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10, 'global');`,
      ['Global App Test', globalDomain, 'Tag', 'Desc', catId, countryId, [], 'free', null, 'T', 't@e.co', true, 'ip_scope_1']
    )
    assert(globalRes.rows[0].submit_product_with_rate_limit !== null, 'Submission with scope "global" and empty served countries ([]) succeeds')
    await client.query(`DELETE FROM public.submissions WHERE website_url = $1;`, [globalDomain])

    let selectedEmptyScopeBlocked = false
    try {
      await client.query(
        `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10, 'selected_countries');`,
        ['Selected App Test', `https://selected-empty-${Date.now()}.org`, 'Tag', 'Desc', catId, countryId, [], 'free', null, 'T', 't@e.co', true, 'ip_scope_2']
      )
    } catch (err) {
      if (err.message.includes('INVALID_COUNTRY_SERVED')) selectedEmptyScopeBlocked = true
    }
    assert(selectedEmptyScopeBlocked, 'Submission with explicit scope "selected_countries" and empty served countries blocked with INVALID_COUNTRY_SERVED')

    // 9. CANONICAL DOMAIN NORMALIZATION (QUERY & FRAGMENT STRIPPING) TESTS
    console.log('\n--- 9. URL Normalization & Query/Fragment Stripping Tests ---')
    let queryDupBlocked = false
    try {
      await client.query(
        `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10);`,
        ['QuickBridge Query Test', 'https://quickbridge.app?utm_source=twitter&ref=directory', 'Tag', 'Desc', catId, countryId, [countryId], 'free', null, 'T', 't@e.co', true, 'ip_query_1']
      )
    } catch (err) {
      if (err.message.includes('DUPLICATE_DOMAIN')) queryDupBlocked = true
    }
    assert(queryDupBlocked, 'Catalog duplicate with query parameters (?utm_source=...) blocked with DUPLICATE_DOMAIN')

    let hashDupBlocked = false
    try {
      await client.query(
        `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10);`,
        ['QuickBridge Hash Test', 'https://quickbridge.app#pricing-section', 'Tag', 'Desc', catId, countryId, [countryId], 'free', null, 'T', 't@e.co', true, 'ip_hash_1']
      )
    } catch (err) {
      if (err.message.includes('DUPLICATE_DOMAIN')) hashDupBlocked = true
    }
    assert(hashDupBlocked, 'Catalog duplicate with hash fragment (#pricing) blocked with DUPLICATE_DOMAIN')

    // Test cross-submission canonical deduplication (submission 1 has query, submission 2 has fragment)
    const testCanonicalBase = `canonical-edge-${Date.now()}.co.za`
    const sub1Res = await client.query(
      `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10);`,
      ['Canonical Base App', `https://${testCanonicalBase}?ref=producthunt`, 'Tag', 'Desc', catId, countryId, [countryId], 'free', null, 'T', 't@e.co', true, 'ip_canon_1']
    )
    assert(sub1Res.rows[0].submit_product_with_rate_limit !== null, 'First submission with query parameter successfully recorded')

    let crossDupBlocked = false
    try {
      await client.query(
        `SELECT public.submit_product_with_rate_limit($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 10);`,
        ['Canonical Base App 2', `https://${testCanonicalBase}#features`, 'Tag', 'Desc', catId, countryId, [countryId], 'free', null, 'T', 't@e.co', true, 'ip_canon_2']
      )
    } catch (err) {
      if (err.message.includes('DUPLICATE_SUBMISSION') || err.message.includes('duplicate key value')) {
        crossDupBlocked = true
      }
    }
    assert(crossDupBlocked, 'Second pending submission for same domain with different fragment blocked with DUPLICATE_SUBMISSION')

    // Clean up canonical test
    await client.query(`DELETE FROM public.submissions WHERE website_url LIKE '%${testCanonicalBase}%';`)

    // 10. STRICT TLS & AUTHENTICATION REJECTION TEST (SQLSTATE 28P01)
    console.log('\n--- 10. Strict TLS Verification & Auth Rejection (28P01) ---')
    assert(client.connection.stream.authorized === true, 'TLS certificate chain verified and stream is authorized by Root CA')

    let authFailed28P01 = false
    const invalidAuthUrl = connectionString.replace(/:[^:@]+@/, ':invalid_password_probe@')
    const badAuthClient = new pg.Client({
      connectionString: invalidAuthUrl,
      ssl,
    })
    try {
      await badAuthClient.connect()
      await badAuthClient.end()
    } catch (err) {
      if (err.code === '28P01') {
        authFailed28P01 = true
      }
    }
    assert(authFailed28P01, 'Fresh connection with invalid/old password rejected specifically with SQLSTATE 28P01 (invalid_password)')

    // Clean up test data
    await client.query('DELETE FROM public.submissions WHERE submitted_ip_hash IN ($1, $2, $3);', [
      testIpHash,
      raceIp1,
      raceIp2,
    ])
    await client.query(`
      DELETE FROM public.submissions 
      WHERE website_url LIKE '%${raceDomain}%' OR website_url LIKE '%concurrent-%';
    `)

    await client.end()

    console.log('\n====================================================')
    console.log(`Test Results: ${passed} passed, ${failed} failed`)
    console.log('====================================================')

    if (failed > 0) {
      process.exit(1)
    }
  } catch (err) {
    console.error('Test execution error:', err)
    try {
      await client.end()
    } catch {}
    process.exit(1)
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e)
  process.exit(1)
})
