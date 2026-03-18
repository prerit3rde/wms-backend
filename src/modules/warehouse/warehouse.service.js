const pool = require("../../config/db");

/* ======================================================
   CREATE
====================================================== */
exports.createWarehouse = async (data, userId) => {
  const query = `
    INSERT INTO warehouses (
      district_name,
      branch_name,
      warehouse_name,
      warehouse_owner_name,
      warehouse_type,
      warehouse_no,
      gst_no,
      pan_card_holder,
      pan_card_number,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.district_name,
    data.branch_name,
    data.warehouse_name,
    data.warehouse_owner_name,
    data.warehouse_type,
    data.warehouse_no,
    data.gst_no,
    data.pan_card_holder,
    data.pan_card_number,
    userId,
  ];

  const [result] = await pool.query(query, values);
  return result;
};

/* ======================================================
   FILTER OPTIONS (MASTER FILTER DATA)
====================================================== */
exports.getWarehouseFilters = async () => {
  const [districts] = await pool.query(
    `SELECT DISTINCT district_name FROM warehouses WHERE is_deleted = FALSE`
  );

  const [branches] = await pool.query(
    `SELECT DISTINCT branch_name, district_name 
     FROM warehouses WHERE is_deleted = FALSE`
  );

  const [warehouses] = await pool.query(
    `SELECT DISTINCT warehouse_name, branch_name, district_name, warehouse_type 
     FROM warehouses WHERE is_deleted = FALSE`
  );

  const [types] = await pool.query(
    `SELECT DISTINCT warehouse_type FROM warehouses WHERE is_deleted = FALSE`
  );

  return {
    districts,
    branches,
    warehouseNames: warehouses,
    warehouseTypes: types,
  };
};

/* ======================================================
   GET ALL (SEARCH + FILTER + SORT + PAGINATION)
====================================================== */
exports.getWarehouses = async (queryParams) => {
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const search = queryParams.search || "";
  const sort = queryParams.sort || "date_desc";

  const district = queryParams.district || "";
  const branch = queryParams.branch || "";
  const warehouse_name = queryParams.warehouse_name || "";
  const warehouse_type = queryParams.warehouse_type || "";

  let query = `SELECT * FROM warehouses WHERE is_deleted = FALSE`;
  let values = [];

  /* SEARCH */
  if (search) {
    query += `
      AND (
        district_name LIKE ?
        OR branch_name LIKE ?
        OR warehouse_name LIKE ?
        OR warehouse_owner_name LIKE ?
      )
    `;
    const s = `%${search}%`;
    values.push(s, s, s, s);
  }

  /* MASTER FILTER */
  if (district) {
    query += ` AND district_name = ?`;
    values.push(district);
  }

  if (branch) {
    query += ` AND branch_name = ?`;
    values.push(branch);
  }

  if (warehouse_name) {
    query += ` AND warehouse_name = ?`;
    values.push(warehouse_name);
  }

  if (warehouse_type) {
    query += ` AND warehouse_type = ?`;
    values.push(warehouse_type);
  }

  /* SORT */
  let orderBy = "created_at DESC";

  switch (sort) {
    case "date_asc":
      orderBy = "created_at ASC";
      break;
    case "district_asc":
      orderBy = "district_name ASC";
      break;
    case "district_desc":
      orderBy = "district_name DESC";
      break;
    case "name_asc":
      orderBy = "warehouse_name ASC";
      break;
    case "name_desc":
      orderBy = "warehouse_name DESC";
      break;
  }

  query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  const [rows] = await pool.query(query, values);

  /* COUNT */
  let countQuery = `SELECT COUNT(*) as total FROM warehouses WHERE is_deleted = FALSE`;
  let countValues = [];

  if (search) {
    countQuery += `
      AND (
        district_name LIKE ?
        OR branch_name LIKE ?
        OR warehouse_name LIKE ?
        OR warehouse_owner_name LIKE ?
      )
    `;
    const s = `%${search}%`;
    countValues.push(s, s, s, s);
  }

  if (district) {
    countQuery += ` AND district_name = ?`;
    countValues.push(district);
  }

  if (branch) {
    countQuery += ` AND branch_name = ?`;
    countValues.push(branch);
  }

  if (warehouse_name) {
    countQuery += ` AND warehouse_name = ?`;
    countValues.push(warehouse_name);
  }

  if (warehouse_type) {
    countQuery += ` AND warehouse_type = ?`;
    countValues.push(warehouse_type);
  }

  const [countResult] = await pool.query(countQuery, countValues);

  return {
    data: rows,
    total: countResult[0].total,
  };
};

/* ======================================================
   GET BY ID
====================================================== */
exports.getWarehouseById = async (id) => {
  const [rows] = await pool.query(
    `SELECT * FROM warehouses WHERE id = ? AND is_deleted = FALSE`,
    [id]
  );
  return rows[0];
};

/* ======================================================
   UPDATE
====================================================== */
exports.updateWarehouse = async (id, data) => {
  const query = `
    UPDATE warehouses SET
      district_name = ?,
      branch_name = ?,
      warehouse_name = ?,
      warehouse_owner_name = ?,
      warehouse_type = ?,
      warehouse_no = ?,
      gst_no = ?,
      pan_card_holder = ?,
      pan_card_number = ?
    WHERE id = ? AND is_deleted = FALSE
  `;

  const values = [
    data.district_name,
    data.branch_name,
    data.warehouse_name,
    data.warehouse_owner_name,
    data.warehouse_type,
    data.warehouse_no,
    data.gst_no,
    data.pan_card_holder,
    data.pan_card_number,
    id,
  ];

  const [result] = await pool.query(query, values);
  return result;
};

/* ======================================================
   DELETE
====================================================== */
exports.deleteWarehouse = async (id) => {
  const [result] = await pool.query(
    `UPDATE warehouses SET is_deleted = TRUE WHERE id = ?`,
    [id]
  );
  return result;
};