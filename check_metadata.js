const pool = require("./src/config/db");
async function check() {
  const [rows] = await pool.query("SELECT * FROM reports WHERE financial_year IS NOT NULL AND financial_year != ''");
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
check();
