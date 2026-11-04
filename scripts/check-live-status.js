import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const res = await pool.query(`
    SELECT 
      slug, 
      publication_status, 
      author_name, 
      reviewer_name, 
      last_reviewed_at, 
      COALESCE(jsonb_array_length(citations), 0) as citation_count
    FROM public.resources
    ORDER BY created_at ASC;
  `);

  console.log("=== LIVE DATABASE RESOURCES STATUS ===");
  console.table(res.rows);

  const pubCount = await pool.query(`
    SELECT count(*) FROM public.resources WHERE publication_status = 'published';
  `);
  console.log("Total published resources in live DB:", pubCount.rows[0].count);

  const verRes = await pool.query(`
    SELECT id, product_id, reviewer_name, verification_date
    FROM public.editorial_verifications;
  `);
  console.log("=== EDITORIAL VERIFICATIONS IN LIVE DB ===");
  console.table(verRes.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
