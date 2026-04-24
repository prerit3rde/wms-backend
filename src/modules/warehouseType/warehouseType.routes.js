const express = require("express");
const router = express.Router();
const controller = require("./warehouseType.controller");

/* CREATE */
router.post("/", controller.createType);

/* GET ALL */
router.get("/", controller.getTypes);

/* GET DEFAULT */
router.get("/default", controller.getDefault);

/* SET DEFAULT */
router.patch("/:id/set-default", controller.setDefault);

/* UNSET DEFAULT */
router.patch("/:id/unset-default", controller.unsetDefault);

/* UPDATE */
router.put("/:id", controller.updateType);

/* DELETE */
router.delete("/:id", controller.deleteType);

module.exports = router;