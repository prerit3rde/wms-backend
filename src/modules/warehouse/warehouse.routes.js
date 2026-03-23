const express = require("express");
const router = express.Router();

const warehouseController = require("./warehouse.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { roleMiddleware } = require("../../middlewares/role.middleware");

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.post("/", warehouseController.createWarehouse);
router.get("/filters", warehouseController.getWarehouseFilters);
router.get("/", warehouseController.getWarehouses);
router.get("/:id", warehouseController.getWarehouseById);
router.delete("/:id", warehouseController.deleteWarehouse);
router.put("/:id", warehouseController.updateWarehouse);

router.post("/bulk-insert", warehouseController.bulkInsertWarehouses);

module.exports = router;
