import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is required.')
  process.exit(1)
}

console.log('Connecting to database:', connectionString.replace(/:[^:@]+@/, ':***@'))

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  try {
    await client.connect()
    console.log('Connected successfully.')

    // 1. Ensure schema migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version VARCHAR(150) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // 2. Query already applied migrations
    const appliedRes = await client.query('SELECT version FROM public.schema_migrations;')
    const appliedSet = new Set(appliedRes.rows.map((r) => r.version))

    // If tracking table was just created on an existing populated database, record baseline migrations
    if (appliedSet.size === 0) {
      const checkTables = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'products'
        ) AS has_products;
      `)
      if (checkTables.rows[0].has_products) {
        console.log('Pre-existing database schema detected. Recording baseline migrations...')
        const baselines = [
          '20261102000001_initial_schema.sql',
          '20261102000002_seed_taxonomy_and_candidates.sql',
        ]
        for (const base of baselines) {
          await client.query(
            'INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING;',
            [base]
          )
          appliedSet.add(base)
          console.log(`[RECORDED BASELINE] ${base}`)
        }
      }
    }

    // 3. Scan migrations directory
    const migrationDir = path.resolve('supabase/migrations')
    const files = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    let appliedCount = 0

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[SKIP] Already applied: ${file}`)
        continue
      }

      console.log(`[APPLYING] ${file}...`)
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8')

      await client.query('BEGIN;')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO public.schema_migrations (version) VALUES ($1);',
          [file]
        )
        await client.query('COMMIT;')
        console.log(`[SUCCESS] ✓ Applied: ${file}`)
        appliedCount++
      } catch (err) {
        await client.query('ROLLBACK;')
        console.error(`[ERROR] Failed to apply ${file}. Rolled back transaction.`)
        throw err
      }
    }

    console.log(`\nMigration run complete. Applied ${appliedCount} new migration(s).`)

    // Diagnostics
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)
    console.log('Current public tables:', tables.rows.map((r) => r.table_name))

    const migrationHistory = await client.query(
      'SELECT version, applied_at FROM public.schema_migrations ORDER BY version;'
    )
    console.log('Applied migrations history in database:')
    for (const row of migrationHistory.rows) {
      console.log(`  - ${row.version} (${row.applied_at.toISOString()})`)
    }

    await client.end()
  } catch (err) {
    console.error('Migration execution failed:', err)
    try {
      await client.end()
    } catch {}
    process.exit(1)
  }
}

run()
