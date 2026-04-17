const pool = require("../../config/db");

/* ======================================================
   CREATE
====================================================== */
exports.createWarehouse = async (data, userId) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { cropData = [], ...basic } = data;

    /* ================= INSERT WAREHOUSE ================= */
    const [warehouseResult] = await conn.query(
      `INSERT INTO warehouses (
        district_name,
        branch_name,
        warehouse_name,
        warehouse_owner_name,
        warehouse_type_id,
        warehouse_no,
        gst_no,
        pan_card_holder,
        pan_card_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        basic.district_name,
        basic.branch_name,
        basic.warehouse_name,
        basic.warehouse_owner_name,
        basic.warehouse_type_id,
        basic.warehouse_no,
        basic.gst_no || null,
        basic.pan_card_holder,
        basic.pan_card_number,
      ]
    );

    const warehouseId = warehouseResult.insertId;

    /* ================= INSERT CROP DATA ================= */
    for (const item of cropData) {
      const approved = Number(item.approved_storage_capacity || 0);
      const actual = Number(item.actual_storage_capacity || 0);
      const rate = Number(item.scheme_rate_amount || 0);

      const affidavit_amount = approved * 50;

      const certificate_amount = item.is_affidavit
        ? 0
        : Number(item.bank_solvency_certificate_amount || 0);

      const base_solvency = item.is_affidavit
        ? affidavit_amount
        : certificate_amount;

      const solvency_balance =
        base_solvency - Number(item.bank_solvency_deduction_by_bill || 0);

      const total_emi = (actual * rate) / 2;

      const balance_emi =
        total_emi - Number(item.emi_deduction_by_bill || 0);

      await conn.query(
        `INSERT INTO warehouse_crop_data (
          warehouse_id,
          crop_year,
          scheme,
          scheme_rate_amount,
          actual_storage_capacity,
          approved_storage_capacity,
          is_affidavit,
          bank_solvency_affidavit_amount,
          bank_solvency_certificate_amount,
          bank_solvency_deduction_by_bill,
          bank_solvency_balance_amount,
          total_emi,
          emi_deduction_by_bill,
          balance_amount_emi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          warehouseId,
          item.crop_year,
          item.scheme,
          rate,
          actual,
          approved,
          item.is_affidavit,
          affidavit_amount,
          certificate_amount,
          item.bank_solvency_deduction_by_bill || 0,
          solvency_balance,
          total_emi,
          item.emi_deduction_by_bill || 0,
          balance_emi,
        ]
      );
    }

    await conn.commit();

    return { insertId: warehouseId };

  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
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

  const [cropYears] = await pool.query(`
    SELECT DISTINCT crop_year 
    FROM warehouse_crop_data
    ORDER BY crop_year DESC
  `);

  return {
    districts,
    branches,
    warehouseNames: warehouses,
    warehouseTypes: types,
    cropYears,
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

    const crop_year = queryParams.crop_year || "";

    let query = `
      SELECT 
        w.id,
        w.district_name,
        w.branch_name,
        w.warehouse_name,
        w.warehouse_owner_name,
        w.warehouse_type_id,
        w.warehouse_no,
        w.gst_no,
        w.pan_card_holder,
        w.pan_card_number,

        wt.name AS warehouse_type,

        wc.crop_year,
        wc.scheme,
        wc.scheme_rate_amount,
        wc.actual_storage_capacity,
        wc.approved_storage_capacity,
        wc.is_affidavit,

        wc.bank_solvency_affidavit_amount,
        wc.bank_solvency_certificate_amount,
        wc.bank_solvency_deduction_by_bill,
        wc.bank_solvency_balance_amount,

        wc.total_emi,
        wc.emi_deduction_by_bill,
        wc.balance_amount_emi

      FROM warehouses w
      LEFT JOIN warehouse_types wt 
        ON w.warehouse_type_id = wt.id
      LEFT JOIN warehouse_crop_data wc 
        ON w.id = wc.warehouse_id
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

    if (crop_year) {
      query += ` AND wc.crop_year = ?`;
      values.push(crop_year);
    }

    if (sort === "imported") {
      query += " AND is_imported = 1";
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
      SELECT COUNT(DISTINCT w.id) as total
      FROM warehouses w
      LEFT JOIN warehouse_crop_data wc 
      ON w.id = wc.warehouse_id
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

    if (crop_year) {
      countQuery += ` AND wc.crop_year = ?`;
      countValues.push(crop_year);
    }

    const [countResult] = await pool.query(countQuery, countValues);

    const resultList = [];
    const map = new Map();

    rows.forEach((row) => {
      if (!map.has(row.id)) {
        const item = {
          id: row.id,
          district_name: row.district_name,
          branch_name: row.branch_name,
          warehouse_name: row.warehouse_name,
          warehouse_owner_name: row.warehouse_owner_name,
          warehouse_type: row.warehouse_type,
          warehouse_no: row.warehouse_no,
          gst_no: row.gst_no,
          pan_card_holder: row.pan_card_holder,
          pan_card_number: row.pan_card_number,
          cropData: [],
        };
        map.set(row.id, item);
        resultList.push(item);
      }

      if (row.crop_year) {
        map.get(row.id).cropData.push({
          crop_year: row.crop_year,
          scheme: row.scheme,
          scheme_rate_amount: row.scheme_rate_amount,
          actual_storage_capacity: row.actual_storage_capacity,
          approved_storage_capacity: row.approved_storage_capacity,
          is_affidavit: Boolean(row.is_affidavit),
          bank_solvency_affidavit_amount: row.bank_solvency_affidavit_amount,
          bank_solvency_certificate_amount: row.bank_solvency_certificate_amount,
          bank_solvency_deduction_by_bill: row.bank_solvency_deduction_by_bill,
          bank_solvency_balance_amount: row.bank_solvency_balance_amount,
          total_emi: row.total_emi,
          emi_deduction_by_bill: row.emi_deduction_by_bill,
          balance_amount_emi: row.balance_amount_emi,
        });
      }
    });

    return {
      data: resultList,
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
  const [warehouse] = await pool.query(
    `SELECT * FROM warehouses WHERE id = ?`,
    [id]
  );

  if (!warehouse.length) return null;

  const [cropData] = await pool.query(
    `SELECT * FROM warehouse_crop_data WHERE warehouse_id = ?`,
    [id]
  );

  return {
    id: warehouse[0].id,
    district_name: warehouse[0].district_name,
    branch_name: warehouse[0].branch_name,
    warehouse_name: warehouse[0].warehouse_name,
    warehouse_owner_name: warehouse[0].warehouse_owner_name,
    warehouse_type_id: warehouse[0].warehouse_type_id,
    warehouse_no: warehouse[0].warehouse_no,
    gst_no: warehouse[0].gst_no,
    pan_card_holder: warehouse[0].pan_card_holder,
    pan_card_number: warehouse[0].pan_card_number,

    cropData: cropData.map((item) => ({
      crop_year: item.crop_year,
      scheme: item.scheme,
      scheme_rate_amount: Number(item.scheme_rate_amount),
      actual_storage_capacity: Number(item.actual_storage_capacity),
      approved_storage_capacity: Number(item.approved_storage_capacity),
      is_affidavit: Boolean(item.is_affidavit),

      bank_solvency_affidavit_amount: Number(item.bank_solvency_affidavit_amount),
      bank_solvency_certificate_amount: Number(item.bank_solvency_certificate_amount),
      bank_solvency_deduction_by_bill: Number(item.bank_solvency_deduction_by_bill),
      bank_solvency_balance_amount: Number(item.bank_solvency_balance_amount),

      total_emi: Number(item.total_emi),
      emi_deduction_by_bill: Number(item.emi_deduction_by_bill),
      balance_amount_emi: Number(item.balance_amount_emi),
    })),
  };
};

/* ======================================================
   UPDATE
====================================================== */
exports.updateWarehouse = async (id, data) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { cropData = [], ...basic } = data;

    /* UPDATE BASE */
    await conn.query(
      `UPDATE warehouses SET
        district_name = ?,
        branch_name = ?,
        warehouse_name = ?,
        warehouse_owner_name = ?,
        warehouse_type_id = ?,
        warehouse_no = ?,
        gst_no = ?,
        pan_card_holder = ?,
        pan_card_number = ?
      WHERE id = ?`,
      [
        basic.district_name,
        basic.branch_name,
        basic.warehouse_name,
        basic.warehouse_owner_name,
        basic.warehouse_type_id,
        basic.warehouse_no,
        basic.gst_no || null,
        basic.pan_card_holder,
        basic.pan_card_number,
        id,
      ]
    );

    /* DELETE OLD CROP DATA */
    await conn.query(
      `DELETE FROM warehouse_crop_data WHERE warehouse_id = ?`,
      [id]
    );

    /* INSERT NEW */
    for (const item of cropData) {
      await conn.query(
        `INSERT INTO warehouse_crop_data (
      warehouse_id,
      crop_year,
      scheme,
      scheme_rate_amount,
      actual_storage_capacity,
      approved_storage_capacity,
      is_affidavit,
      bank_solvency_affidavit_amount,
      bank_solvency_certificate_amount,
      bank_solvency_deduction_by_bill,
      bank_solvency_balance_amount,
      total_emi,
      emi_deduction_by_bill,
      balance_amount_emi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.crop_year,
          item.scheme,
          Number(item.scheme_rate_amount || 0),
          Number(item.actual_storage_capacity || 0),
          Number(item.approved_storage_capacity || 0),
          item.is_affidavit ? 1 : 0,

          // ✅ DIRECT VALUES (NO CALCULATION)
          Number(item.bank_solvency_affidavit_amount || 0),
          Number(item.bank_solvency_certificate_amount || 0),
          Number(item.bank_solvency_deduction_by_bill || 0),
          Number(item.bank_solvency_balance_amount || 0),

          Number(item.total_emi || 0),
          Number(item.emi_deduction_by_bill || 0),
          Number(item.balance_amount_emi || 0),
        ]
      );
    }

    await conn.commit();
    return { success: true };

  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/* ======================================================
   DELETE
====================================================== */
exports.deleteWarehouse = async (id) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // ✅ 1. Soft delete warehouse
    const [warehouseResult] = await conn.query(
      `UPDATE warehouses SET is_deleted = TRUE WHERE id = ?`,
      [id]
    );

    if (warehouseResult.affectedRows === 0) {
      throw new Error("Warehouse not found");
    }

    // ✅ 2. Delete related crop data
    await conn.query(
      `DELETE FROM warehouse_crop_data WHERE warehouse_id = ?`,
      [id]
    );

    await conn.commit();

    return warehouseResult;

  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};