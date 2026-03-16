const express = require("express");
const router = express.Router();
const controller = require("./reports.controller");
const verifyToken = require("../../middlewares/auth.middleware")

router.get("/claims", verifyToken, controller.getClaimsReport);

router.post(
    "/claims/generate",
    verifyToken,
    controller.generateClaimsReport
);

router.get("/history", verifyToken, controller.getReportHistory);

router.get(
    "/download/:id",
    verifyToken,
    controller.downloadReport
);

module.exports = router;