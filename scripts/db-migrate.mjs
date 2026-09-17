// Applies every db/migrations/*.sql file that hasn't been recorded in
// schema_migrations yet, in filename order.
//
//   npm run db:migrate            (uses DATABASE_URL, falling back to .env.local)

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { neon, neonConfig } from '@neondatabase/serverless'

const MIGRATIONS_DIR = 'db/migrations'

function loadEnvLocal() {
  if (process.env.DATABASE_URL || !existsSync('.env.local')) return
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
}

// The HTTP driver runs one statement per query, so split on semicolons that
// end a line. Our migrations are plain DDL with no functions/strings containing
// `;\n`, which keeps this safe.
function splitStatements(source) {
  return source
    .replace(/^\s*--.*$/gm, '')
    .split(/;\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean)
}

loadEnvLocal()

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (checked the environment and .env.local)')
  process.exit(1)
}

if (process.env.NEON_FETCH_ENDPOINT) {
  neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT
}

const sql = neon(process.env.DATABASE_URL)

await sql`create table if not exists schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
)`

const applied = new Set((await sql`select name from schema_migrations`).map((row) => row.name))
const files = readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith('.sql')).sort()

let count = 0
for (const file of files) {
  if (applied.has(file)) continue

  const statements = splitStatements(readFileSync(join(MIGRATIONS_DIR, file), 'utf-8'))
  await sql.transaction([
    ...statements.map((statement) => sql.query(statement)),
    sql`insert into schema_migrations (name) values (${file})`,
  ])
  console.log(`applied ${file}`)
  count++
}

console.log(count ? `${count} migration(s) applied` : 'database is up to date')
