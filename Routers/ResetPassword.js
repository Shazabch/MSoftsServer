const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const User = require("../Models/Clients");
const router = express.Router();
const jwt = require('jsonwebtoken');

// Send password reset link
router.post("/reset-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    // Create JWT payload with user info
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role, // Optional: Include role or any other information you need
    };

    // Sign the token with a secret key and expiration (1 hour)
    const resetToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create the reset link
    const resetLink = `http://localhost:5173/reset-password/${encodeURIComponent(resetToken)}`;
    console.log("Reset Link:", resetLink); // Debugging reset link

    // Create reusable transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Only for development
      }
    });

    // Create email template
    const mailOptions = {
      from: {
        name: "Majestic Softs",
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: "Password Reset Request",
      text: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p style="color: #666;">Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        </div>
      `
    };

    // Send the reset email
    try {
      const info = await transporter.sendMail(mailOptions);
      res.json({ 
        message: "Password reset link sent to your email.",
        messageId: info.messageId 
      });
    } catch (error) {
       return res.status(500).json({ 
        message: "Failed to send reset email",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

  } catch (error) {
    console.error("General Error:", error);
    res.status(500).json({ 
      message: "An error occurred. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Handle password reset
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    console.log("Received Token for Password Reset:", token); // Debugging token received

    // Verify and decode the JWT token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decodedToken); // Debugging token decoding
    } catch (err) {
      console.log("JWT Error:", err.message);
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Find user by decoded token data
    const user = await User.findOne({ 
      _id: decodedToken.id,  // Use user ID from decoded token
    });

    if (!user) {
      console.log("User not found with ID:", decodedToken.id);
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log("Hashed New Password:", hashedPassword); // Debugging password hashing

    user.password = hashedPassword;
    await user.save();
    console.log("Password updated successfully");

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: {
        name: "Majestic Softs",
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: "Password Reset Successful",
      text: "Your password has been successfully reset.",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset Successful</h2>
          <p style="color: #666;">Your password has been successfully reset. You can now log in with your new password.</p>
          <p style="color: #666; font-size: 14px;">If you didn't make this change, please contact support immediately.</p>
        </div>
      `
    });

    res.json({ message: "Password successfully reset." });
  } catch (error) {
    console.error("Reset Error:", error);
    res.status(500).json({ 
      message: "An error occurred. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
