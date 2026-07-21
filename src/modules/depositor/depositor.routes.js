const express = require("express");
const router = express.Router();
const controller = require("./depositor.controller");

/* CREATE */
router.post("/", controller.createDepositor);

/* GET ALL */
router.get("/", controller.getDepositors);

/* UPDATE */
router.put("/:id", controller.updateDepositor);

/* DELETE */
router.delete("/:id", controller.deleteDepositor);

module.exports = router;
