const express = require("express");
const router = express.Router();
const controller = require("./reports.controller");
const verifyToken = require("../../middlewares/auth.middleware")

router.get("/payments", verifyToken, controller.getPaymentsReport);

router.post(
    "/payments/generate",
    verifyToken,
    controller.generatePaymentsReport
);

router.get("/history", verifyToken, controller.getReportHistory);

router.get(
    "/download/:id",
    verifyToken,
    controller.downloadReport
);

module.exports = router;