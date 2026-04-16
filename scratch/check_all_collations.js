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
    const [tables] = await connection.query("SHOW TABLES");
    const dbName = process.env.DB_NAME || 'wms_database';
    
    for (let table of tables) {
      const tableName = Object.values(table)[0];
      const [status] = await connection.query(`SHOW TABLE STATUS WHERE Name = '${tableName}'`);
      console.log(`Table: ${tableName}, Collation: ${status[0]?.Collation}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
