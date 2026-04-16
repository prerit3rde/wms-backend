const db = require("../../config/db");

/* ================= CREATE ================= */
exports.createPayment = async (data) => {
  const billAmount = Number(data.bill_amount || 0);

  const actualPassed = billAmount;

  const tds =
    data.tds !== undefined && data.tds !== ""
      ? Number(data.tds)
      : billAmount * 0.1;

  const deduction_20_percent =
    data.deduction_20_percent !== undefined &&
      data.deduction_20_percent !== ""
      ? Number(data.deduction_20_percent)
      : billAmount * 0.2;

  const totalDeductions =
    Number(data.tds || 0) +
    Number(data.amount_deducted_against_gain_loss || 0) +
    Number(data.emi_amount || 0) +
    Number(data.deduction_20_percent || 0) +
    Number(data.penalty || 0) +
    Number(data.medicine || 0) +
    Number(data.emi_fdr_interest || 0) +
    Number(data.gain_shortage_deduction || 0) +
    Number(data.stock_shortage_deduction || 0) +
    Number(data.bank_solvancy || 0) +
    Number(data.insurance || 0) +
    Number(data.other_deduction_amount || 0);

  const pay_to_jvs_amount = billAmount - totalDeductions;

  const payload = {
    ...data,
    bill_amount: billAmount,
    actual_passed_amount: actualPassed,
    status: "Pending",
    tds,
    deduction_20_percent,
    pay_to_jvs_amount,
  };

  const [result] = await db.query(
    `INSERT INTO payments SET ?`,
    payload
  );

  return result.insertId;
};

/* ================= FILTER OPTIONS ================= */
exports.getPaymentFilters = async () => {
  const [districts] = await db.query(
    `SELECT DISTINCT district_name FROM payments`
  );

  const [branches] = await db.query(
    `SELECT DISTINCT branch_name, district_name FROM payments`
  );

  const [warehouses] = await db.query(
    `SELECT DISTINCT warehouse_name, branch_name, district_name, warehouse_type 
     FROM payments`
  );

  const [types] = await db.query(
    `SELECT DISTINCT warehouse_type FROM payments`
  );

  const [cropYears] = await db.query(
    `SELECT DISTINCT crop_year FROM payments WHERE crop_year IS NOT NULL AND crop_year != ''`
  );
  
  const [statuses] = await db.query(
    `SELECT DISTINCT status FROM payments`
  );

  return {
    districts,
    branches,
    warehouseNames: warehouses,
    warehouseTypes: types,
    statuses,
    cropYears: cropYears.map(c => c.crop_year),
  };
};

/* ================= GET ALL (Pagination + Filter) ================= */
exports.getAllPayments = async (queryParams) => {
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
  const crop_year = queryParams.crop_year || "";

  let query = `SELECT * FROM payments WHERE 1=1`;
  let values = [];

  /* SEARCH */
  if (search) {
    query += `
      AND (
        district_name LIKE ?
        OR branch_name LIKE ?
        OR warehouse_name LIKE ?
        OR warehouse_type LIKE ?
        OR commodity LIKE ?
        OR depositers_name LIKE ?
      )
    `;
    const s = `%${search}%`;
    values.push(s, s, s, s, s, s);
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

  if (crop_year) {
    query += ` AND crop_year = ?`;
    values.push(crop_year);
  }

  /* DATE FILTER */
  if (from_date && to_date) {
    query += ` AND DATE(created_at) BETWEEN ? AND ?`;
    values.push(from_date, to_date);
  }

  if (sort === "imported") {
    query += " AND is_imported = 1";
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
  let countQuery = `SELECT COUNT(*) as total FROM payments WHERE 1=1`;
  let countValues = [];

  if (search) {
    countQuery += `
      AND (
        district_name LIKE ?
        OR branch_name LIKE ?
        OR warehouse_name LIKE ?
        OR commodity LIKE ?
      OR depositers_name LIKE ?
      )
    `;
    const s = `%${search}%`;
    countValues.push(s, s, s, s, s);
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

  if (crop_year) {
    countQuery += ` AND crop_year = ?`;
    countValues.push(crop_year);
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
exports.getPaymentById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT 
      c.*,
      u1.name AS approved_by_name,
      u2.name AS rejected_by_name
    FROM payments c
    LEFT JOIN users u1 ON c.approved_by = u1.id
    LEFT JOIN users u2 ON c.rejected_by = u2.id
    WHERE c.id = ?
    `,
    [id]
  );

  return rows[0];
};

/* ================= UPDATE ================= */
exports.updatePayment = async (id, data) => {
  const billAmount = Number(data.bill_amount || 0);

  const actualPassed = billAmount;

  const tds =
    data.tds !== undefined && data.tds !== ""
      ? Number(data.tds)
      : billAmount * 0.1;

  const deduction_20_percent =
    data.deduction_20_percent !== undefined &&
      data.deduction_20_percent !== ""
      ? Number(data.deduction_20_percent)
      : billAmount * 0.2;

  const totalDeductions =
    Number(data.tds || 0) +
    Number(data.amount_deducted_against_gain_loss || 0) +
    Number(data.emi_amount || 0) +
    Number(data.deduction_20_percent || 0) +
    Number(data.penalty || 0) +
    Number(data.medicine || 0) +
    Number(data.emi_fdr_interest || 0) +
    Number(data.gain_shortage_deduction || 0) +
    Number(data.stock_shortage_deduction || 0) +
    Number(data.bank_solvancy || 0) +
    Number(data.insurance || 0) +
    Number(data.other_deduction_amount || 0);

  const pay_to_jvs_amount = billAmount - totalDeductions;

  const {
    id: paymentId,
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
    bill_amount: billAmount,
    actual_passed_amount: actualPassed,
    tds,
    deduction_20_percent,
    pay_to_jvs_amount,
  };

  const [result] = await db.query(
    `UPDATE payments SET ? WHERE id = ? AND status = 'Pending'`,
    [payload, id]
  );

  if (result.affectedRows === 0) return null;

  const [updated] = await db.query(
    `SELECT * FROM payments WHERE id = ?`,
    [id]
  );

  return updated[0];
};

/* ================= DELETE ================= */
exports.deletePayment = async (id) => {
  const [check] = await db.query(
    `SELECT status FROM payments WHERE id = ?`,
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
      "Approved and rejected payments can't be deleted"
    );
  }

  const [result] = await db.query(
    `DELETE FROM payments WHERE id = ?`,
    [id]
  );

  return result;
};

/* ================= APPROVE ================= */
exports.approvePayment = async (id, userId) => {
  const [result] = await db.query(
    `UPDATE payments 
     SET status='Approved', approved_by=?, approved_at=NOW()
     WHERE id=? AND status='Pending'`,
    [userId, id]
  );
  return result;
};

/* ================= REJECT ================= */
exports.rejectPayment = async (id, userId) => {
  const [result] = await db.query(
    `UPDATE payments 
     SET status='Rejected', rejected_by=?, rejected_at=NOW()
     WHERE id=? AND status='Pending'`,
    [userId, id]
  );
  return result;
};