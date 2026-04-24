const paymentService = require("./payment.service");
const { createPaymentSchema } = require("./payment.validation");
const pool = require("../../config/db");
const warehouseTypeService = require("../warehouseType/warehouseType.service");
// const { convertKrutiToUnicode } = require("../../../utils/krutiConverter.js");
const kru2uni = require("@anthro-ai/krutidev-unicode");

const convertHindi = (val) => {
  if (!val) return val;

  try {
    return kru2uni(val);
  } catch (e) {
    return val;
  }
};

/* ================= CREATE ================= */

exports.createPayment = async (req, res) => {
  try {

    const { error } = createPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const id = await paymentService.createPayment(req.body);

    return res.status(201).json({
      success: true,
      message: "Payment added successfully",
      data: { id }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: err.message
    });
  }
};

/* ================= GET ALL ================= */

/* ================= FILTER OPTIONS ================= */
exports.getPaymentFilters = async (req, res) => {
  try {
    const data = await paymentService.getPaymentFilters();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL ================= */
exports.getAllPayments = async (req, res) => {
  try {
    const result = await paymentService.getAllPayments(req.query);

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: err.message,
    });
  }
};
/* ================= GET ONE ================= */

exports.getPayment = async (req, res) => {
  try {

    const data = await paymentService.getPaymentById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No payment found with this ID"
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: err.message
    });
  }
};

/* ================= UPDATE ================= */

exports.updatePayment = async (req, res) => {
  try {
    const updatedPayment = await paymentService.updatePayment(
      req.params.id,
      req.body
    );

    if (!updatedPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment not found or already processed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: updatedPayment   // 🔥 RETURN UPDATED PAYMENT
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update payment",
      error: err.message
    });
  }
};

/* ================= DELETE ================= */

exports.deletePayment = async (req, res) => {
  try {

    const result = await paymentService.deletePayment(req.params.id);

    if (!result || result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Payment not found or already processed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      error: err.message
    });
  }
};

/* ================= APPROVE ================= */

exports.approvePayment = async (req, res) => {
  try {

    const userId = req.user.id; // 🔥 get admin id from token

    const result = await paymentService.approvePayment(req.params.id, userId);

    if (!result || result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Payment not found or already processed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment approved successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to approve payment",
      error: err.message
    });
  }
};

/* ================= REJECT ================= */

exports.rejectPayment = async (req, res) => {
  try {

    const userId = req.user.id; // 🔥 get admin id from token

    const result = await paymentService.rejectPayment(req.params.id, userId);

    if (!result || result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Payment not found or already processed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment rejected successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject payment",
      error: err.message
    });
  }
};

const clean = (val) => {
  return val?.toString().trim();
};

const normalizeRow = (row) => {
  const newRow = {};

  Object.keys(row).forEach((key) => {
    const cleanKey = key
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    newRow[cleanKey] = row[key];
  });

  return newRow;
};

const ALL_COLUMNS = [
  "bill_type",
  "district_name",
  "branch_name",
  "warehouse_name",
  "warehouse_type",
  "commodity",
  "crop_year",
  "rate",
  "depositers_name",
  "pan_card_holder",
  "pan_card_number",
  "warehouse_no",
  "bill_amount",
  "total_jv_amount",
  "actual_passed_amount",
  "tds",
  "emi_amount",
  "amount_deducted_against_gain_loss",
  "penalty",
  "medicine",
  "emi_fdr_interest",
  "gain_shortage_deduction",
  "stock_shortage_deduction",
  "bank_solvancy",
  "insurance",
  "other_deduction_amount",
  "other_deductions_reason",
  "pay_to_jvs_amount",
  "security_fund_amount",
  "payment_by",
  "payment_date",
  "qtr",
  "remarks",
  "from_date",
  "to_date",
  "financial_year",
  "month",
  "deduction_20_percent",
  "is_imported"
];

exports.bulkInsertPayments = async (req, res) => {
  try {
    const { data, mode = "update" } = req.body;

    const [types] = await pool.query("SELECT * FROM warehouse_types");

    const typeMap = {};
    types.forEach((t) => {
      typeMap[t.name.trim().toLowerCase()] = t.id;
    });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const clean = (val) => val?.toString().trim();

    const normalizeRow = (row) => {
      const newRow = {};

      Object.keys(row).forEach((key) => {
        const cleanKey = key
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[.%()]/g, "")
          .replace(/__+/g, "_");

        let finalKey = cleanKey;

        if (cleanKey === "pan_card_numbar") finalKey = "pan_card_number";
        if (cleanKey === "commidity") finalKey = "commodity";
        if (cleanKey === "gdn_no" || cleanKey === "gdn_no.")
          finalKey = "warehouse_no";
        if (cleanKey === "gain_shortage_deducton" || cleanKey === "gain_shortage_deduction")
          finalKey = "gain_shortage_deduction";
        if (cleanKey === "other" || cleanKey === "other_deduction")
          finalKey = "other_deduction_amount";
        if (cleanKey === "amount_deducted_against_gain")
          finalKey = "amount_deducted_against_gain_loss";
        if (cleanKey === "20_deduction_amount_against_gain" || cleanKey === "20_deduction_amount_against_1_gain")
          finalKey = "deduction_20_percent";

        newRow[finalKey] = row[key];
      });

      return newRow;
    };

    const convertPeriod = (row, payload) => {
      if (!row.period || payload.from_date) return;

      const [mon, yr] = row.period.split("-");
      if (!mon || !yr) return;

      const monthMap = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      };

      const m = mon.toLowerCase();

      if (monthMap[m] !== undefined) {
        const year = parseInt("20" + yr);

        const firstDay = new Date(year, monthMap[m], 1);
        const lastDay = new Date(year, monthMap[m] + 1, 0);

        const formatLocalDate = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };

        payload.from_date = formatLocalDate(firstDay);
        payload.to_date = formatLocalDate(lastDay);
        payload.month = firstDay.toLocaleString("en-IN", { month: "long" });

        let fyStart = year;
        let fyEnd = year + 1;

        if (monthMap[m] < 3) {
          fyStart = year - 1;
          fyEnd = year;
        }

        payload.financial_year = `${fyStart}-${String(fyEnd).slice(-2)}`;
      }
    };

    // =====================================================
    // 🚀 INSERT MODE
    // =====================================================
    if (mode === "insert") {
      const batchSize = 500;
      const finalValues = [];

      // ✅ Fetch default warehouse type once
      const defaultTypeRow = await warehouseTypeService.getDefaultType();
      const defaultWarehouseType = defaultTypeRow?.name || null;

      data.reverse();

      for (let row of data) {
        row = normalizeRow(row);
        delete row.sr_no;

        const payload = {
          ...row,
          is_imported: 1,
        };

        // ✅ Apply default warehouse type if missing in the sheet
        if (!payload.warehouse_type && defaultWarehouseType) {
          payload.warehouse_type = defaultWarehouseType;
        }

        convertPeriod(row, payload);

        // ✅ FIXED: CROP YEAR LOGIC
        if (row.crop_year) {
          payload.crop_year = row.crop_year;
        } else if (row.commodity) {
          const match = row.commodity.match(/-(\d{2,4})$/);
          if (match) {
            const yrStr = match[1];
            const yr = parseInt(yrStr.slice(-2)); // handle both 2 and 4 digit years
            const fullYear = 2000 + yr;
            payload.crop_year = `${fullYear - 1}-${String(fullYear).slice(-2)}`;
          }
        }

        const cleanRow = {};

        ALL_COLUMNS.forEach((col) => {
          cleanRow[col] = payload[col] ?? null;
        });

        const values = ALL_COLUMNS.map((col) => cleanRow[col]);

        if (values.every((v) => v === null || v === "")) continue;

        finalValues.push(values);
      }

      for (let i = 0; i < finalValues.length; i += batchSize) {
        const chunk = finalValues.slice(i, i + batchSize);

        await pool.query(
          `INSERT INTO payments (${ALL_COLUMNS.join(",")}) VALUES ?`,
          [chunk]
        );
      }

      return res.json({
        success: true,
        inserted: finalValues.length,
        updated: 0,
        skipped: 0,
      });
    }

    // =====================================================
    // 🔁 UPDATE MODE (🔥 MAIN FIX HERE)
    // =====================================================
    for (let row of data) {
      row = normalizeRow(row);

      row.warehouse_name = convertHindi(row.warehouse_name);
      row.branch_name = convertHindi(row.branch_name);

      delete row.sr_no;

      const payload = {
        ...row,
        is_imported: 1,
      };

      convertPeriod(row, payload);

      // ✅ CROP YEAR LOGIC
      if (row.crop_year) {
        payload.crop_year = row.crop_year;
      } else if (row.commodity) {
        const match = row.commodity.match(/-(\d{2,4})$/);
        if (match) {
          const yrStr = match[1];
          const yr = parseInt(yrStr.slice(-2));
          const fullYear = 2000 + yr;
          payload.crop_year = `${fullYear - 1}-${String(fullYear).slice(-2)}`;
        }
      }

      let existingRecordId = null;

      // 1️⃣ Priority Check: ID match (Most robust for exported sheets)
      if (row.id && !isNaN(parseInt(row.id))) {
        const [byId] = await pool.query("SELECT id FROM payments WHERE id = ? LIMIT 1", [row.id]);
        if (byId.length) {
          existingRecordId = byId[0].id;
        }
      }

      // 2️⃣ Fallback Check: Multi-column match (For manually created sheets)
      if (!existingRecordId) {
        const typeId = typeMap[clean(row.warehouse_type)?.toLowerCase()];

        const [warehouse] = await pool.query(
          `SELECT id FROM warehouses 
           WHERE LOWER(TRIM(district_name))=? 
           AND LOWER(TRIM(branch_name))=? 
           AND warehouse_type_id=? 
           AND LOWER(TRIM(warehouse_name))=? 
           LIMIT 1`,
          [
            clean(row.district_name),
            clean(row.branch_name),
            typeId,
            clean(row.warehouse_name),
          ]
        );

        if (warehouse.length) {
          const [byMatch] = await pool.query(
            `SELECT id FROM payments 
             WHERE LOWER(TRIM(district_name))=? 
             AND LOWER(TRIM(branch_name))=? 
             AND LOWER(TRIM(warehouse_name))=? 
             AND DATE(from_date)=DATE(?) 
             LIMIT 1`,
            [
              clean(row.district_name),
              clean(convertHindi(row.branch_name)),
              clean(convertHindi(row.warehouse_name)),
              payload.from_date,
            ]
          );
          if (byMatch.length) {
            existingRecordId = byMatch[0].id;
          }
        }
      }

      if (existingRecordId) {
        // Only include columns that actually exist in the database
        const updatePayload = {};
        ALL_COLUMNS.forEach(col => {
          if (payload[col] !== undefined) {
            updatePayload[col] = payload[col];
          }
        });

        // Ensure we don't try to update the ID
        delete updatePayload.id;

        await pool.query(
          "UPDATE payments SET ? WHERE id = ?",
          [updatePayload, existingRecordId]
        );
        updated++;
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};