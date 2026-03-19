const express = require("express");
const router = express.Router();
const controller = require("./warehouseType.controller");

/* CREATE */
router.post("/", controller.createType);

/* GET */
router.get("/", controller.getTypes);

/* UPDATE */
router.put("/:id", controller.updateType);

/* DELETE */
router.delete("/:id", controller.deleteType);

module.exports = router;