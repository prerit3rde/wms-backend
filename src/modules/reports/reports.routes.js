const express = require("express");
const router = express.Router();
const controller = require("./reports.controller");

router.get("/financial-years", controller.getFinancialYears);
router.get("/preview", controller.previewReport);
router.post("/generate", controller.generateReport);
router.get("/", controller.getReports);

module.exports = router;