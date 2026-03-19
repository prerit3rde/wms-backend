const pool = require("../../config/db");

/* ======================================================
   CREATE
====================================================== */
exports.createWarehouse = async (data, userId) => {
  const {
    approved_storage_capacity,
    actual_storage_capacity,
    scheme_rate_amount,
    bank_solvency_deduction_by_bill = 0,
    emi_deduction_by_bill = 0,
    is_affidavit,
    bank_solvency_certificate_amount = 0,
  } = data;

  // ✅ CALCULATIONS
  const affidavit_amount = approved_storage_capacity * 50;

  const certificate_amount = is_affidavit
    ? 0
    : bank_solvency_certificate_amount;

  const base_solvency = is_affidavit
    ? affidavit_amount
    : certificate_amount;

  const solvency_balance =
    base_solvency - bank_solvency_deduction_by_bill;

  const total_emi =
    (actual_storage_capacity * scheme_rate_amount) / 2;

  const balance_emi =
    total_emi - emi_deduction_by_bill;

  const query = `
    INSERT INTO warehouses (
      district_name,
      branch_name,
      warehouse_name,
      warehouse_owner_name,
      warehouse_type_id,
      warehouse_no,
      gst_no,

      scheme,
      scheme_rate_amount,
      actual_storage_capacity,
      approved_storage_capacity,

      bank_solvency_affidavit_amount,
      bank_solvency_certificate_amount,
      bank_solvency_deduction_by_bill,
      bank_solvency_balance_amount,

      total_emi,
      emi_deduction_by_bill,
      balance_amount_emi,

      pan_card_holder,
      pan_card_number,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.district_name,
    data.branch_name,
    data.warehouse_name,
    data.warehouse_owner_name,
    data.warehouse_type_id,
    data.warehouse_no,
    data.gst_no || null,

    data.scheme,
    data.scheme_rate_amount,
    data.actual_storage_capacity,
    data.approved_storage_capacity,

    affidavit_amount,
    certificate_amount,
    bank_solvency_deduction_by_bill,
    solvency_balance,

    total_emi,
    emi_deduction_by_bill,
    balance_emi,

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

  const [warehouses] = await pool.query(`
    SELECT 
      w.warehouse_name, 
      w.branch_name, 
      w.district_name, 
      wt.name AS warehouse_type,
      w.warehouse_type_id
    FROM warehouses w
    LEFT JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
    WHERE w.is_deleted = FALSE
  `);

  const [types] = await pool.query(`
    SELECT id, name FROM warehouse_types
  `);

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
  try {
    const page = Number(queryParams.page) || 1;
    const limit = Number(queryParams.limit) || 10;
    const offset = (page - 1) * limit;

    const search = queryParams.search || "";
    const sort = queryParams.sort || "date_desc";

    const district = queryParams.district || "";
    const branch = queryParams.branch || "";
    const warehouse_name = queryParams.warehouse_name || "";
    const warehouse_type = queryParams.warehouse_type || "";

    let query = `
      SELECT w.*, wt.name AS warehouse_type
      FROM warehouses w
      LEFT JOIN warehouse_types wt 
        ON w.warehouse_type_id = wt.id
      WHERE w.is_deleted = FALSE
    `;

    let values = [];

    /* SEARCH */
    if (search) {
      query += `
        AND (
          w.district_name LIKE ?
          OR w.branch_name LIKE ?
          OR w.warehouse_name LIKE ?
          OR w.warehouse_owner_name LIKE ?
        )
      `;
      const s = `%${search}%`;
      values.push(s, s, s, s);
    }

    /* FILTERS */
    if (district) {
      query += ` AND w.district_name = ?`;
      values.push(district);
    }

    if (branch) {
      query += ` AND w.branch_name = ?`;
      values.push(branch);
    }

    if (warehouse_name) {
      query += ` AND w.warehouse_name = ?`;
      values.push(warehouse_name);
    }

    if (warehouse_type) {
      query += ` AND w.warehouse_type_id = ?`;
      values.push(warehouse_type);
    }

    /* SORT */
    let orderBy = "w.id DESC";

    switch (sort) {
      case "date_asc":
        orderBy = "w.id ASC";
        break;
      case "district_asc":
        orderBy = "w.district_name ASC";
        break;
      case "district_desc":
        orderBy = "w.district_name DESC";
        break;
      case "name_asc":
        orderBy = "w.warehouse_name ASC";
        break;
      case "name_desc":
        orderBy = "w.warehouse_name DESC";
        break;
    }

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const [rows] = await pool.query(query, values);

    /* COUNT QUERY (FIXED) */
    let countQuery = `
      SELECT COUNT(*) as total
      FROM warehouses w
      WHERE w.is_deleted = FALSE
    `;

    let countValues = [];

    if (search) {
      countQuery += `
        AND (
          w.district_name LIKE ?
          OR w.branch_name LIKE ?
          OR w.warehouse_name LIKE ?
          OR w.warehouse_owner_name LIKE ?
        )
      `;
      const s = `%${search}%`;
      countValues.push(s, s, s, s);
    }

    if (district) {
      countQuery += ` AND w.district_name = ?`;
      countValues.push(district);
    }

    if (branch) {
      countQuery += ` AND w.branch_name = ?`;
      countValues.push(branch);
    }

    if (warehouse_name) {
      countQuery += ` AND w.warehouse_name = ?`;
      countValues.push(warehouse_name);
    }

    if (warehouse_type) {
      countQuery += ` AND w.warehouse_type_id = ?`;
      countValues.push(warehouse_type);
    }

    const [countResult] = await pool.query(countQuery, countValues);

    return {
      data: rows,
      total: countResult[0].total,
    };

  } catch (error) {
    console.error("GET WAREHOUSE ERROR:", error); // 🔥 VERY IMPORTANT
    throw error;
  }
};

/* ======================================================
   GET BY ID
====================================================== */
exports.getWarehouseById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT w.*, wt.name AS warehouse_type
    FROM warehouses w
    LEFT JOIN warehouse_types wt 
      ON w.warehouse_type_id = wt.id
    WHERE w.id = ?
    `,
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
      warehouse_type_id = ?,
      warehouse_no = ?,
      gst_no = ?,

      scheme = ?,
      scheme_rate_amount = ?,
      actual_storage_capacity = ?,
      approved_storage_capacity = ?,

      bank_solvency_certificate_amount = ?,
      bank_solvency_deduction_by_bill = ?,
      emi_deduction_by_bill = ?,

      pan_card_holder = ?,
      pan_card_number = ?
    WHERE id = ? AND is_deleted = FALSE
  `;

  const values = [
    data.district_name,
    data.branch_name,
    data.warehouse_name,
    data.warehouse_owner_name,
    data.warehouse_type_id,
    data.warehouse_no,
    data.gst_no || null,

    data.scheme,
    data.scheme_rate_amount,
    data.actual_storage_capacity,
    data.approved_storage_capacity,

    data.bank_solvency_certificate_amount || 0,
    data.bank_solvency_deduction_by_bill || 0,
    data.emi_deduction_by_bill || 0,

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