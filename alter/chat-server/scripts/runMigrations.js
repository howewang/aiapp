const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function run() {
  const dir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    await pool.query(sql);
    console.log('Ran:', f);
  }
  console.log('Migrations done');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
