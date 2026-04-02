const db = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const generateToken = require("../utils/generateToken");
const { sendResetEmail } = require("../services/email.service");
const { sendEmailChangeVerification } = require("../services/email.service");

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, "admin"]
    );

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user[0]);

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [resetToken, expiry, email]
    );

    await sendResetEmail(email, resetToken);

    res.json({ message: "Reset link sent to email" });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const [user] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token]
    );

    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hashedPassword, user[0].id]
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const [users] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("Change Password Error:", error); // 👈 ADD THIS
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const [users] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // ✅ Always update name
    await db.query(
      "UPDATE users SET name = ? WHERE id = ?",
      [name, userId]
    );

    // 🔥 If email is SAME
    if (email === user.email) {
      const [updatedUser] = await db.query(
        "SELECT * FROM users WHERE id = ?",
        [userId]
      );

      const userData = {
        ...updatedUser[0],
        pendingEmail: updatedUser[0].pending_email || null, // ✅ MAP HERE
      };

      const newToken = generateToken(userData);

      return res.json({
        success: true,
        message: "Profile updated",
        token: newToken, // ✅ IMPORTANT
      });
    }

    // 🔥 CHECK: email already exists
    const [existing] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // ✅ Generate verification token
    const emailToken = crypto.randomBytes(32).toString("hex");

    await db.query(
      "UPDATE users SET pending_email = ?, email_token = ? WHERE id = ?",
      [email, emailToken, userId]
    );

    // ✅ Send email
    await sendEmailChangeVerification(user.email, emailToken);

    // ✅ Generate fresh JWT
    const [updatedUser] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    const userData = {
      ...updatedUser[0],
      pendingEmail: updatedUser[0].pending_email || null, // ✅ MAP HERE
    };

    const newToken = generateToken(userData);

    return res.json({
      success: true,
      message: "Profile updated (email verification pending)",
      token: newToken, // ✅ FIXED
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.confirmEmailChange = async (req, res) => {
  try {
    const { token } = req.params;

    const [users] = await db.query(
      "SELECT * FROM users WHERE email_token = ?",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).send(`
        <h2>❌ Invalid or expired link</h2>
      `);
    }

    const user = users[0];

    // ✅ Update email
    await db.query(
      `UPDATE users 
       SET email = pending_email,
           pending_email = NULL,
           email_token = NULL
       WHERE id = ?`,
      [user.id]
    );

    // ✅ Fetch updated user
    const [updatedUser] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [user.id]
    );

    // ✅ Generate new token
    const userData = {
      ...updatedUser[0],
      pendingEmail: updatedUser[0].pending_email || null, // ✅ MAP HERE
    };

    const newToken = generateToken(userData);

    // ✅ Redirect to frontend with token
    return res.redirect(
      `${process.env.FRONTEND_URL}/email-confirmed?token=${newToken}`
    );

  } catch (error) {
    console.error("Confirm Email Error:", error);

    return res.status(500).send(`
      <h2>❌ Something went wrong</h2>
    `);
  }
};