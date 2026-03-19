const pool = require("../../config/db");

/* CREATE */
exports.createType = async (name) => {
  const [existing] = await pool.query(
    "SELECT * FROM warehouse_types WHERE LOWER(name) = LOWER(?)",
    [name]
  );

  if (existing.length > 0) {
    throw new Error("Warehouse type already exists");
  }

  const [result] = await pool.query(
    "INSERT INTO warehouse_types (name) VALUES (?)",
    [name]
  );

  return result;
};

/* GET */
exports.getTypes = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM warehouse_types ORDER BY id DESC"
  );
  return rows;
};

/* UPDATE */
exports.updateType = async (id, name) => {
  await pool.query(
    "UPDATE warehouse_types SET name = ? WHERE id = ?",
    [name, id]
  );
};

/* DELETE */
exports.deleteType = async (id) => {
  await pool.query(
    "DELETE FROM warehouse_types WHERE id = ?",
    [id]
  );
};