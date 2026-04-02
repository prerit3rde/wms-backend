const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/auth.middleware");


router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.put("/change-password", verifyToken, authController.changePassword);
router.put("/update-profile", verifyToken, authController.updateProfile);
router.get("/confirm-email/:token", authController.confirmEmailChange);

module.exports = router;
