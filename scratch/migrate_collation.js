const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wms_database'
  });

  try {
    const tablesToMigrate = [
      'reports',
      'users',
      'warehouse_crop_data',
      'warehouse_types',
      'warehouses'
    ];

    for (const table of tablesToMigrate) {
      console.log(`Migrating table: ${table}...`);
      await connection.query(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    }

    console.log("Migration completed successfully!");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}

migrate();
