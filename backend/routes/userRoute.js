const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "sadtodo12345";

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const success = await sendEmail(
      user.email,
      "Password Reset Request",
      `
        <p>Hello ${user.username || ""},</p>
        <p>You requested to reset your password.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
      `
    );

    if (!success) {
      return res.status(500).json({ message: "Email service failed" });
    }

    res.json({ message: "Reset link sent to your email." });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset Password route
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;