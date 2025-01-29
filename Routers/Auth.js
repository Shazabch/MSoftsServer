const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SubAdmin = require("../Models/Subadmin");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "msofts"; // Use environment variable for security

// SuperAdmin Hardcoded Credentials (Replace with DB storage for better security)
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || "superadmin@gmail.com";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "superadmin"; // Store hashed password in DB if needed

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // SuperAdmin login
    if (email === SUPERADMIN_EMAIL) {
      // If using bcrypt for SuperAdmin password, compare with hashed password
      const isPasswordCorrect = password === SUPERADMIN_PASSWORD;

      if (!isPasswordCorrect) {
        return res.status(400).json({ error: "Invalid credentials for SuperAdmin" });
      }

      const token = jwt.sign(
        {
          id: "superadmin-id", // Dummy ID for SuperAdmin
          email: SUPERADMIN_EMAIL,
          username: "SuperAdmin",
          permissions: ["allPermissions"],
          isAdmin: true,
          role: "superadmin",
        },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.status(200).json({ message: "SuperAdmin login successful", token });
    }

    // SubAdmin login
    const subAdmin = await SubAdmin.findOne({ email });
    if (!subAdmin) {
      return res.status(404).json({ error: "SubAdmin not found" });
    }

    const isMatch = await bcrypt.compare(password, subAdmin.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: subAdmin._id,
        email: subAdmin.email,
        username: subAdmin.username,
        permissions: subAdmin.permissions,
        isAdmin: true,
        role: "subadmin",
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "SubAdmin login successful", token });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Access denied, token missing" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
};

// Example protected route
router.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({ message: "Protected route accessed", user: req.user });
});

// Logout route (clear session)
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    res.status(200).json({ message: "Logged out successfully" });
  });
});

module.exports = router;
