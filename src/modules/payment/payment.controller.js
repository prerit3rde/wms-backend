const paymentService = require("./payment.service");
const { createPaymentSchema } = require("./payment.validation");
const pool = require("../../config/db");

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

exports.bulkInsertPayments = async (req, res) => {
  try {
    const { data, mode = "update" } = req.body;

    const [types] = await pool.query("SELECT * FROM warehouse_types");

    const typeMap = {};
    types.forEach((t) => {
      typeMap[t.name] = t.id;
    });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    let updatedIds = [];
    let skippedIds = [];

    const clean = (val) => val?.toString().trim();

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

    for (let row of data) {
      row = normalizeRow(row);

      // ✅ Fix warehouse_owner mapping
      if (row.warehouse_owner) {
        row.warehouse_owner_name = row.warehouse_owner;
        delete row.warehouse_owner;
      }

      const typeId = typeMap[clean(row.warehouse_type)];

      if (!typeId) {
        throw new Error(`Invalid warehouse type: ${row.warehouse_type}`);
      }

      const [warehouse] = await pool.query(
        `SELECT w.*, wt.name as warehouse_type_name
         FROM warehouses w
         JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
         WHERE TRIM(LOWER(w.district_name)) = TRIM(LOWER(?))
         AND TRIM(LOWER(w.branch_name)) = TRIM(LOWER(?))
         AND w.warehouse_type_id = ?
         AND TRIM(LOWER(w.warehouse_name)) = TRIM(LOWER(?))
         AND TRIM(w.warehouse_no) = TRIM(?)`,
        [
          clean(row.district_name),
          clean(row.branch_name),
          typeId,
          clean(row.warehouse_name),
          clean(row.warehouse_no),
        ]
      );

      if (!warehouse.length) {
        throw new Error(`Warehouse not found: ${row.warehouse_name}`);
      }

      const w = warehouse[0];

      const payload = {};

      const allowedFields = [
        "district_name",
        "branch_name",
        "warehouse_name",
        "warehouse_owner_name",
        "warehouse_type",
        "warehouse_no",
        "gst_no",
        "scheme",
        "scheme_rate_amount",
        "actual_storage_capacity",
        "approved_storage_capacity",
        "bank_solvency_affidavit_amount",
        "bank_solvency_certificate_amount",
        "bank_solvency_deduction_by_bill",
        "bank_solvency_balance",
        "total_emi",
        "emi_deduction_by_bill",
        "emi_balance",
        "pan_card_holder",
        "pan_card_number",
        "rent_bill_number",
        "bill_type",
        "month",
        "financial_year",
        "from_date",
        "to_date",
        "commodity",
        "crop_year",
        "rate",
        "total_jv_amount",
        "bill_amount",
        "actual_passed_amount",
        "depositers_name",
        "scientific_capacity",
        "number_of_days",
        "per_day_rate",
        "rent_amount_on_scientific_capacity",
        "tds",
        "amount_deducted_against_gain_loss",
        "emi_amount",
        "deduction_20_percent",
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
      ];

      // ✅ Build payload
      Object.keys(row).forEach((key) => {
        if (key === "sr_no") return;

        if (allowedFields.includes(key) && row[key] !== "" && row[key] !== undefined) {
          payload[key] = row[key];
        }
      });

      // ✅ 🔥 FIX: Convert payment_date AFTER payload build
      if (payload.payment_date) {
        const d = new Date(payload.payment_date);

        if (!isNaN(d)) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");

          payload.payment_date = `${year}-${month}-${day}`;
        } else {
          payload.payment_date = null;
        }
      }

      // ❌ Never overwrite ID
      delete payload.id;

      // ✅ System fields
      payload.is_imported = 1;

      // ✅ Fill from warehouse
      payload.warehouse_type = w.warehouse_type_name;
      payload.warehouse_owner_name = w.warehouse_owner_name;
      payload.gst_no = w.gst_no;

      payload.scheme = payload.scheme ?? w.scheme;
      payload.scheme_rate_amount =
        payload.scheme_rate_amount ?? w.scheme_rate_amount;

      payload.actual_storage_capacity =
        payload.actual_storage_capacity ?? w.actual_storage_capacity;

      payload.approved_storage_capacity =
        payload.approved_storage_capacity ?? w.approved_storage_capacity;

      payload.bank_solvency_affidavit_amount =
        payload.bank_solvency_affidavit_amount ??
        w.bank_solvency_affidavit_amount;

      payload.bank_solvency_certificate_amount =
        payload.bank_solvency_certificate_amount ??
        w.bank_solvency_certificate_amount;

      payload.bank_solvency_deduction_by_bill =
        payload.bank_solvency_deduction_by_bill ??
        w.bank_solvency_deduction_by_bill;

      payload.bank_solvency_balance =
        payload.bank_solvency_balance ?? w.bank_solvency_balance;

      payload.total_emi = payload.total_emi ?? w.total_emi;
      payload.emi_deduction_by_bill =
        payload.emi_deduction_by_bill ?? w.emi_deduction_by_bill;
      payload.emi_balance = payload.emi_balance ?? w.emi_balance;

      payload.pan_card_holder = w.pan_card_holder;
      payload.pan_card_number = w.pan_card_number;

      // 🔥 INSERT MODE
      if (mode === "insert") {
        await pool.query(`INSERT INTO payments SET ?`, [payload]);
        inserted++;
        continue;
      }

      // 🔥 UPDATE MODE
      const recordId = row.id || row.sr_no;

      const [existingRows] = await pool.query(
        "SELECT * FROM payments WHERE id = ?",
        [recordId]
      );

      if (existingRows.length > 0) {
        const existing = existingRows[0];

        let isChanged = false;

        for (const key in payload) {
          let existingVal = existing[key];
          let newVal = payload[key];

          // ✅ Special handling for payment_date
          if (key === "payment_date") {
            existingVal = existingVal
              ? `${new Date(existingVal).getFullYear()}-${String(new Date(existingVal).getMonth() + 1).padStart(2, "0")}-${String(new Date(existingVal).getDate()).padStart(2, "0")}`
              : "";

            newVal = newVal
              ? `${new Date(newVal).getFullYear()}-${String(new Date(newVal).getMonth() + 1).padStart(2, "0")}-${String(new Date(newVal).getDate()).padStart(2, "0")}`
              : "";
          } else {
            existingVal = existingVal?.toString().trim() || "";
            newVal = newVal?.toString().trim() || "";
          }

          if (existingVal !== newVal) {
            isChanged = true;
            break;
          }
        }

        console.log("Updating ID:", recordId);
        console.log("OLD DATE:", existing.payment_date);
        console.log("NEW DATE:", payload.payment_date);

        if (isChanged) {
          await pool.query(
            "UPDATE payments SET ? WHERE id = ?",
            [payload, recordId]
          );

          updated++;
          updatedIds.push(recordId);
        } else {
          skipped++;
          skippedIds.push(recordId);
        }
      } else {
        await pool.query(`INSERT INTO payments SET ?`, [payload]);
        inserted++;
      }
    }

    let message = "";

    if (inserted > 0) {
      message += `${inserted} payments inserted successfully. `;
    }

    if (updated > 0) {
      message += `${updated} payments updated (IDs: ${updatedIds.join(", ")}). `;
    }

    if (skipped > 0) {
      message += `${skipped} payments already exist (IDs: ${skippedIds.join(", ")}).`;
    }

    res.json({
      success: true,
      message: message || "No changes detected",
      stats: { inserted, updated, skipped },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || "Import failed",
    });
  }
};