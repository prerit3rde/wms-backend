const pool = require("./src/config/db");
async function check() {
  const [tables] = await pool.query("SHOW TABLES");
  console.log("Tables:", tables);
  for (let table of tables) {
    const tableName = Object.values(table)[0];
    const [cols] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`Columns for ${tableName}:`, cols);
  }
  process.exit(0);
}
check();
