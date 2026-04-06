const express = require("express");
const router = express.Router();
const controller = require("./reports.controller");
const verifyToken = require("../../middlewares/auth.middleware")

router.get("/financial-years", controller.getFinancialYears);
router.get("/preview", controller.previewReport);
router.post("/generate", controller.generateReport);
router.get("/", controller.getReports);
router.get("/download", verifyToken, controller.downloadReport);
router.delete("/:id", verifyToken, controller.deleteReport);

module.exports = router;