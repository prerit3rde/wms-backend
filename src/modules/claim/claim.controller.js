const claimService = require("./claim.service");
const { createClaimSchema } = require("./claim.validation");

/* ================= CREATE ================= */

exports.createClaim = async (req, res) => {
  try {

    const { error } = createClaimSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const id = await claimService.createClaim(req.body);

    return res.status(201).json({
      success: true,
      message: "Claim added successfully",
      data: { id }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to create claim",
      error: err.message
    });
  }
};

/* ================= GET ALL ================= */

/* ================= FILTER OPTIONS ================= */
exports.getClaimFilters = async (req, res) => {
  try {
    const data = await claimService.getClaimFilters();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL ================= */
exports.getAllClaims = async (req, res) => {
  try {
    const result = await claimService.getAllClaims(req.query);

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch claims",
      error: err.message,
    });
  }
};
/* ================= GET ONE ================= */

exports.getClaim = async (req, res) => {
  try {

    const data = await claimService.getClaimById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No claim found with this ID"
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch claim",
      error: err.message
    });
  }
};

/* ================= UPDATE ================= */

exports.updateClaim = async (req, res) => {
  try {
    const updatedClaim = await claimService.updateClaim(
      req.params.id,
      req.body
    );

    if (!updatedClaim) {
      return res.status(400).json({
        success: false,
        message: "Claim not found or already processed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Claim updated successfully",
      data: updatedClaim   // 🔥 RETURN UPDATED CLAIM
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update claim",
      error: err.message
    });
  }
};

/* ================= DELETE ================= */

exports.deleteClaim = async (req, res) => {
  try {

    const result = await claimService.deleteClaim(req.params.id);

    if (!result || result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Claim not found or already processed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Claim deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete claim",
      error: err.message
    });
  }
};

/* ================= APPROVE ================= */

exports.approveClaim = async (req, res) => {
  try {

    const userId = req.user.id; // 🔥 get admin id from token

    const result = await claimService.approveClaim(req.params.id, userId);

    if (!result || result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Claim not found or already processed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Claim approved successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to approve claim",
      error: err.message
    });
  }
};

/* ================= REJECT ================= */

exports.rejectClaim = async (req, res) => {
  try {

    const userId = req.user.id; // 🔥 get admin id from token

    const result = await claimService.rejectClaim(req.params.id, userId);

    if (!result || result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Claim not found or already processed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Claim rejected successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject claim",
      error: err.message
    });
  }
};