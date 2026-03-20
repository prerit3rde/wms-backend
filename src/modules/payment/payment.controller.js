const paymentService = require("./payment.service");
const { createPaymentSchema } = require("./payment.validation");

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