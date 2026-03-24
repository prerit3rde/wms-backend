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

exports.bulkInsertPayments = async (req, res) => {
  try {
    const { data } = req.body;

    // ✅ preload types
    const [types] = await pool.query("SELECT * FROM warehouse_types");

    const typeMap = {};
    types.forEach((t) => {
      typeMap[t.name] = t.id;
    });

    for (const row of data) {
      // 🔁 get type id
      const typeId = typeMap[clean(row.warehouse_type)];

      if (!typeId) {
        throw new Error(`Invalid warehouse type: ${row.warehouse_type}`);
      }

      // 🔍 find warehouse (using ID)
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
        throw new Error(
          `Warehouse not found: ${row.warehouse_name}`
        );
      }

      const w = warehouse[0];

      // ✅ FINAL PAYLOAD (FIXED)
      const payload = {
        ...row,

        is_imported: 1, // ✅ mark imported

        warehouse_type: w.warehouse_type_name,

        // auto-fill from warehouse
        warehouse_owner_name: w.warehouse_owner_name,
        gst_no: w.gst_no,
        scheme: w.scheme,
        scheme_rate_amount: w.scheme_rate_amount,

        actual_storage_capacity: w.actual_storage_capacity,
        approved_storage_capacity: w.approved_storage_capacity,

        bank_solvency_affidavit_amount:
          w.bank_solvency_affidavit_amount,
        bank_solvency_certificate_amount:
          w.bank_solvency_certificate_amount,
        bank_solvency_deduction_by_bill:
          w.bank_solvency_deduction_by_bill,
        bank_solvency_balance: w.bank_solvency_balance,

        total_emi: w.total_emi,
        emi_deduction_by_bill: w.emi_deduction_by_bill,
        emi_balance: w.emi_balance,

        pan_card_holder: w.pan_card_holder,
        pan_card_number: w.pan_card_number,
      };

      // ❌ remove unwanted fields
      // delete payload.warehouse_type;

      // 🧾 insert
      await pool.query(`INSERT INTO payments SET ?`, [payload]);
    }

    res.json({ message: "Payments imported successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Import failed",
    });
  }
};