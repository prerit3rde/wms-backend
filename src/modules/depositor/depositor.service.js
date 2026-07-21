const pool = require("../../config/db");

/* ================= ENSURE TABLE ================= */
/* Idempotent table creation so the module works without a manual migration step. */
exports.ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS depositors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      depositor_name VARCHAR(255) NOT NULL,
      gst_number VARCHAR(50) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

/* ================= CREATE ================= */
exports.createDepositor = async (depositor_name, gst_number) => {
  const [existing] = await pool.query(
    "SELECT id FROM depositors WHERE LOWER(depositor_name) = LOWER(?)",
    [depositor_name]
  );

  if (existing.length > 0) {
    throw new Error("Depositor already exists");
  }

  const [result] = await pool.query(
    "INSERT INTO depositors (depositor_name, gst_number) VALUES (?, ?)",
    [depositor_name, gst_number || null]
  );

  return result;
};

/* ================= GET ================= */
exports.getDepositors = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM depositors ORDER BY id DESC"
  );
  return rows;
};

/* ================= UPDATE ================= */
exports.updateDepositor = async (id, depositor_name, gst_number) => {
  await pool.query(
    "UPDATE depositors SET depositor_name = ?, gst_number = ? WHERE id = ?",
    [depositor_name, gst_number || null, id]
  );
};

/* ================= DELETE ================= */
exports.deleteDepositor = async (id) => {
  await pool.query(
    "DELETE FROM depositors WHERE id = ?",
    [id]
  );
};
