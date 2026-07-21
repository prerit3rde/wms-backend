const service = require("./depositor.service");

/* CREATE */
exports.createDepositor = async (req, res) => {
  try {
    const { depositor_name, gst_number } = req.body;

    if (!depositor_name || !depositor_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Depositor name is required",
      });
    }

    await service.createDepositor(depositor_name.trim(), gst_number?.trim());

    res.status(201).json({
      success: true,
      message: "Depositor added successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* GET */
exports.getDepositors = async (req, res) => {
  try {
    const data = await service.getDepositors();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* UPDATE */
exports.updateDepositor = async (req, res) => {
  try {
    const { depositor_name, gst_number } = req.body;

    if (!depositor_name || !depositor_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Depositor name is required",
      });
    }

    await service.updateDepositor(req.params.id, depositor_name.trim(), gst_number?.trim());

    res.json({
      success: true,
      message: "Depositor updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* DELETE */
exports.deleteDepositor = async (req, res) => {
  try {
    await service.deleteDepositor(req.params.id);

    res.json({
      success: true,
      message: "Depositor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
