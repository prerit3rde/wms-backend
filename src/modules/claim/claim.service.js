const db = require("../../config/db");

/* ================= CREATE ================= */
exports.createClaim = async (data) => {

  const totalJV = Number(data.total_jv_amount || 0);
  const actualPassed = Number(data.actual_passed_amount || 0);

  const tds = totalJV * 0.10;
  const deduction20 = totalJV * 0.20;

  const payToJVS =
    actualPassed -
    tds -
    deduction20;

  const payload = {
    ...data,
    status: "Pending",

    tds,
    deduction_20_percent: deduction20,
    pay_to_jvs_amount: payToJVS
  };

  const [result] = await db.query(
    `INSERT INTO claims SET ?`,
    payload
  );

  return result.insertId;

};

/* ================= FILTER OPTIONS ================= */
exports.getClaimFilters = async () => {
  const [districts] = await db.query(
    `SELECT DISTINCT district_name FROM claims`
  );

  const [branches] = await db.query(
    `SELECT DISTINCT branch_name, district_name FROM claims`
  );

  const [warehouses] = await db.query(
    `SELECT DISTINCT warehouse_name, branch_name, district_name, warehouse_type 
     FROM claims`
  );

  const [types] = await db.query(
    `SELECT DISTINCT warehouse_type FROM claims`
  );

  const [statuses] = await db.query(
    `SELECT DISTINCT status FROM claims`
  );

  return {
    districts,
    branches,
    warehouseNames: warehouses,
    warehouseTypes: types,
    statuses,
  };
};

/* ================= GET ALL (Pagination + Filter) ================= */
exports.getAllClaims = async (queryParams) => {
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const search = queryParams.search || "";
  const sort = queryParams.sort || "date_desc";
  const district = queryParams.district || "";
  const branch = queryParams.branch || "";
  const warehouse_name = queryParams.warehouse_name || "";
  const warehouse_type = queryParams.warehouse_type || "";
  const from_date = queryParams.from_date || "";
  const to_date = queryParams.to_date || "";

  let query = `SELECT * FROM claims WHERE 1=1`;
  let values = [];

  /* SEARCH */
  if (search) {
    query += `
      AND (
        district_name LIKE ?
        OR branch_name LIKE ?
        OR warehouse_name LIKE ?
      )
    `;
    const s = `%${search}%`;
    values.push(s, s, s, s);
  }

  /* FILTERS */
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

  /* DATE FILTER */
  if (from_date && to_date) {
    query += ` AND DATE(created_at) BETWEEN ? AND ?`;
    values.push(from_date, to_date);
  }

  /* SORTING */
  let orderBy = "id DESC";

  switch (sort) {
    case "date_asc":
      orderBy = "id ASC";
      break;

    case "status_Pending":
      query += ` AND status = 'Pending'`;
      orderBy = "id DESC";
      break;

    case "status_Approved":
      query += ` AND status = 'Approved'`;
      orderBy = "id DESC";
      break;

    case "status_Rejected":
      query += ` AND status = 'Rejected'`;
      orderBy = "id DESC";
      break;
  }

  query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  const [rows] = await db.query(query, values);

  /* COUNT QUERY */
  let countQuery = `SELECT COUNT(*) as total FROM claims WHERE 1=1`;
  let countValues = [];

  if (search) {
    countQuery += `
      AND (
        district_name LIKE ?
        OR branch_name LIKE ?
        OR warehouse_name LIKE ?
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

  if (from_date && to_date) {
    countQuery += ` AND DATE(created_at) BETWEEN ? AND ?`;
    countValues.push(from_date, to_date);
  }

  if (sort.startsWith("status_")) {
    const statusValue = sort.split("_")[1];
    countQuery += ` AND status = ?`;
    countValues.push(statusValue);
  }

  const [countResult] = await db.query(countQuery, countValues);

  return {
    data: rows,
    total: countResult[0].total,
  };
};

/* ================= GET ONE ================= */
exports.getClaimById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT 
      c.*,
      u1.name AS approved_by_name,
      u2.name AS rejected_by_name
    FROM claims c
    LEFT JOIN users u1 ON c.approved_by = u1.id
    LEFT JOIN users u2 ON c.rejected_by = u2.id
    WHERE c.id = ?
    `,
    [id]
  );

  return rows[0];
};

/* ================= UPDATE ================= */
exports.updateClaim = async (id, data) => {

  const totalJV = Number(data.total_jv_amount || 0);
  const actualPassed = Number(data.actual_passed_amount || 0);

  const tds = totalJV * 0.10;
  const deduction20 = totalJV * 0.20;

  const payToJVS =
    actualPassed -
    tds -
    deduction20;

  /* remove fields not in claims table or shouldn't be updated */
  const {
    id: claimId,
    created_at,
    updated_at,
    approved_at,
    rejected_at,
    approved_by_name,
    rejected_by_name,
    ...cleanData
  } = data;

  const payload = {
    ...cleanData,
    tds,
    deduction_20_percent: deduction20,
    pay_to_jvs_amount: payToJVS
  };

  const [result] = await db.query(
    `UPDATE claims SET ? WHERE id = ? AND status = 'Pending'`,
    [payload, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [updated] = await db.query(
    `SELECT * FROM claims WHERE id = ?`,
    [id]
  );

  return updated[0];
};

/* ================= DELETE ================= */
exports.deleteClaim = async (id) => {
  const [check] = await db.query(
    `SELECT status FROM claims WHERE id = ?`,
    [id]
  );

  if (!check.length) {
    return { affectedRows: 0 };
  }

  if (
    check[0].status === "Approved" ||
    check[0].status === "Rejected"
  ) {
    throw new Error(
      "Approved and rejected claims can't be deleted"
    );
  }

  const [result] = await db.query(
    `DELETE FROM claims WHERE id = ?`,
    [id]
  );

  return result;
};

/* ================= APPROVE ================= */
exports.approveClaim = async (id, userId) => {
  const [result] = await db.query(
    `UPDATE claims 
     SET status='Approved', approved_by=?, approved_at=NOW()
     WHERE id=? AND status='Pending'`,
    [userId, id]
  );
  return result;
};

/* ================= REJECT ================= */
exports.rejectClaim = async (id, userId) => {
  const [result] = await db.query(
    `UPDATE claims 
     SET status='Rejected', rejected_by=?, rejected_at=NOW()
     WHERE id=? AND status='Pending'`,
    [userId, id]
  );
  return result;
};