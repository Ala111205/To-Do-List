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

    // Define emailHtml BEFORE sending
    const emailHtml = (username, resetLink) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; color: #007bff; margin-bottom: 20px; }
        p { font-size: 16px; line-height: 1.5; }
        .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .btn:hover { background-color: #0056b3; }
        .footer { margin-top: 30px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Password Reset Request</h1>
        <p>Hello ${username || "User"},</p>
        <p>You requested to reset your password for your To-Do List App account. Click the button below to reset it:</p>
        <a href="${resetLink}" class="btn">Reset Password</a>
        <p>This link will expire in <strong>15 minutes</strong>.</p>
        <p>If you didn't request a password reset, please ignore this email. Your account is safe.</p>
        <div class="footer">&copy; ${new Date().getFullYear()} To-Do List App. All rights reserved.</div>
      </div>
    </body>
    </html>
    `;

    const success = await sendEmail(
      user.email,
      "Password Reset Request",
      emailHtml(user.username, resetLink)
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

    user.password = password;
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