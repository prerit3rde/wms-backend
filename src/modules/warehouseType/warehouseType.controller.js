const service = require("./warehouseType.service");

/* CREATE */
exports.createType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    await service.createType(name);

    res.status(201).json({
      success: true,
      message: "Warehouse type added successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* GET */
exports.getTypes = async (req, res) => {
  try {
    const data = await service.getTypes();

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
exports.updateType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    await service.updateType(req.params.id, name);

    res.json({
      success: true,
      message: "Warehouse type updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* DELETE */
exports.deleteType = async (req, res) => {
  try {
    await service.deleteType(req.params.id);

    res.json({
      success: true,
      message: "Warehouse type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};