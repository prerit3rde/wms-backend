const pool = require("./src/config/db");
async function check() {
  const [rows] = await pool.query("SELECT * FROM reports ORDER BY id ASC LIMIT 10");
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
check();
