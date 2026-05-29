const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database.db')
console.log('Checking DB at:', dbPath)

try {
  const db = new DatabaseSync(dbPath)
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
  console.log('\nTables:', tables.map(t => t.name))

  for (const t of tables) {
    const count = db.prepare(`SELECT COUNT(*) as n FROM ${t.name}`).get()
    console.log(`  ${t.name}: ${count.n} rows`)
  }
  db.close()
} catch (e) {
  console.error('DB Error:', e.message)
}
