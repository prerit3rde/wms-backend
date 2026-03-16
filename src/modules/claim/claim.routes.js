const express = require("express");
const router = express.Router();
const controller = require("./claim.controller");
const verifyToken  = require("../../middlewares/auth.middleware");

router.post("/", controller.createClaim);
router.get("/filters", controller.getClaimFilters);
router.get("/", controller.getAllClaims);
router.get("/:id", controller.getClaim);
router.put("/:id", controller.updateClaim);
router.delete("/:id", controller.deleteClaim);
router.patch("/:id/approve", verifyToken , controller.approveClaim);
router.patch("/:id/reject", verifyToken , controller.rejectClaim);

module.exports = router;