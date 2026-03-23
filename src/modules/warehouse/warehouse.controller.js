const pool = require("../../config/db");

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

exports.bulkInsertWarehouses = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.length) {
      return res.status(400).json({ message: "No data provided" });
    }

    for (const row of data) {
      // ✅ Convert warehouse_type → id
      const [type] = await pool.query(
        "SELECT id FROM warehouse_types WHERE LOWER(name) = LOWER(?)",
        [row.warehouse_type]
      );

      if (!type.length) {
        throw new Error(`Invalid warehouse type: ${row.warehouse_type}`);
      }

      const typeId = type[0].id;

      await pool.query(
        `INSERT INTO warehouses (
          district_name,
          branch_name,
          warehouse_name,
          warehouse_owner_name,
          warehouse_type_id,
          warehouse_no,
          gst_no,
          scheme,
          scheme_rate_amount,
          actual_storage_capacity,
          approved_storage_capacity,
          bank_solvency_affidavit_amount,
          bank_solvency_certificate_amount,
          bank_solvency_deduction_by_bill,
          bank_solvency_balance_amount,
          total_emi,
          emi_deduction_by_bill,
          balance_amount_emi,
          pan_card_holder,
          pan_card_number,
          is_imported
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          row.district_name,
          row.branch_name,
          row.warehouse_name,
          row.warehouse_owner_name,
          typeId,
          row.warehouse_no,
          row.gst_no,
          row.scheme,
          row.scheme_rate_amount,
          row.actual_storage_capacity,
          row.approved_storage_capacity,
          row.bank_solvency_affidavit_amount || 0,
          row.bank_solvency_certificate_amount || 0,
          row.bank_solvency_deduction_by_bill || 0,
          row.bank_solvency_balance_amount || 0,
          row.total_emi || 0,
          row.emi_deduction_by_bill || 0,
          row.balance_amount_emi || 0,
          row.pan_card_holder,
          row.pan_card_number,
        ]
      );
    }

    res.json({
      success: true,
      message: "Warehouses imported successfully",
    });

  } catch (error) {
    console.error("IMPORT ERROR 👉", error); // 🔥 IMPORTANT

    res.status(500).json({
      message: error.message, // 🔥 SHOW REAL ERROR
    });
  }
};