const warehouseService = require("./warehouse.service");

exports.getWarehouseFilters = async (req, res) => {
  try {
    const data = await warehouseService.getWarehouseFilters();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const result = await warehouseService.createWarehouse(
      req.body,
      req.user.id
    );
    // console.log("Warehouse created with ID:", req.user.id);
    res.status(201).json({
      message: "Warehouse created successfully",
      warehouseId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getWarehouses = async (req, res) => {
  try {
    const result = await warehouseService.getWarehouses(req.query);

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteWarehouse = async (req, res) => {
  try {
    const result = await warehouseService.deleteWarehouse(req.params.id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Warehouse not found or already deleted",
      });
    }

    res.json({ message: "Warehouse deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await warehouseService.getWarehouseById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    res.json(warehouse);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const result = await warehouseService.updateWarehouse(
      req.params.id,
      req.body
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    res.json({
      message: "Warehouse updated successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
