const express = require("express");
const router = express.Router();
const controller = require("./payment.controller");
const verifyToken  = require("../../middlewares/auth.middleware");

router.post("/", controller.createPayment);
router.get("/filters", controller.getPaymentFilters);
router.get("/", controller.getAllPayments);
router.get("/:id", controller.getPayment);
router.put("/:id", controller.updatePayment);
router.delete("/:id", controller.deletePayment);
router.patch("/:id/approve", verifyToken , controller.approvePayment);
router.patch("/:id/reject", verifyToken , controller.rejectPayment);

module.exports = router;