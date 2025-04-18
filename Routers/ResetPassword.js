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
    const resetLink = `https://majesticsofts.com/reset-password/${encodeURIComponent(resetToken)}`;

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
        name: "Majestic Softs Team",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "🔐 Reset Your Password - Majestic Softs",
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Majestic Softs</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f7fa; color: #333333;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-width: 100%;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header with fixed logo -->
              <tr>
                <td align="center" style="padding: 0; border-radius: 8px 8px 0 0;">
                  <div style="width: 250px; height: 120px; background-image: url('https://majesticsofts.com/assets/MS2-DIynU2HX.png'); background-size: contain; background-position: center; background-repeat: no-repeat;"></div>
                </td>
              </tr>
              
              <!-- Main content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h1 style="color: #6E42CD; font-size: 28px; font-weight: 600; margin: 0 0 20px; text-align: center;">Password Reset Request 🔐</h1>
                  
                  <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">We received a request to reset your password for your Majestic Softs account. To proceed with resetting your password, please click the button below.</p>
                  
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" style="display: inline-block; background-color: #6E42CD; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 30px; border-radius: 5px;">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="border-left: 4px solid #ffa500; padding-left: 20px; margin-bottom: 20px;">
                    <h3 style="color: #ffa500; font-size: 18px; font-weight: 600; margin: 0 0 10px;">Important Security Notice</h3>
                    <p style="font-size: 14px; line-height: 1.5; margin: 0;">
                      This password reset link will expire in <strong>1 hour</strong> for your security.
                      If you didn't request this password reset, please ignore this email or contact our support team immediately.
                    </p>
                  </div>
                  
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="font-size: 14px; line-height: 1.5; margin: 0;">
                          If the button above doesn't work, you can also copy and paste the following URL into your browser:
                        </p>
                        <p style="font-size: 12px; line-height: 1.5; margin: 10px 0 0; word-break: break-all; background-color: #e8f4fd; padding: 10px; border-radius: 4px; font-family: monospace;">
                          ${resetLink}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f7fa; padding: 30px; border-radius: 0 0 8px 8px;">
                  <p style="font-size: 14px; color: #666666; text-align: center; margin: 0;">
                    Best regards,<br>
                    <strong style="color: #6E42CD;">The Majestic Softs Team</strong>
                  </p>
                  <p style="font-size: 12px; color: #999999; text-align: center; margin: 15px 0 0;">
                    &copy; ${new Date().getFullYear()} Majestic Softs. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
      `,
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
