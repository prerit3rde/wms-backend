const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/auth.middleware");
const { roleMiddleware } = require("../../middlewares/role.middleware");
const dashboardController = require("./dashboard.controller");

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/overview", dashboardController.getOverview);

module.exports = router;