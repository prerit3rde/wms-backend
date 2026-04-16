const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wms_database'
  });

  try {
    const [paymentsTableInfo] = await connection.query("SHOW TABLE STATUS WHERE Name = 'payments'");
    console.log("Payments Table Collation:", paymentsTableInfo[0]?.Collation);

    const [warehousesTableInfo] = await connection.query("SHOW TABLE STATUS WHERE Name = 'warehouses'");
    console.log("Warehouses Table Collation:", warehousesTableInfo[0]?.Collation);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
