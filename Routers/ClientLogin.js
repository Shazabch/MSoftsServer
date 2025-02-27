const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Clients = require('../Models/Clients');
const VerificationCode = require('../Models/VerifyEmail'); // Import Model
const { default: mongoose } = require('mongoose');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'msofts';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// Send Verification Code and Save to DB
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existingClient = await Clients.findOne({ email: email.toLowerCase() });
    if (existingClient) return res.status(400).json({ message: 'Email already registered' });

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expire in 15 min

    // Save to DB (Upsert: Insert if not exists, else update)
    await VerificationCode.findOneAndUpdate(
      { email: email.toLowerCase() },
      { code: verificationCode, expiresAt },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code',
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p><p>This code expires in 15 minutes.</p>`
    });

    res.json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify Code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const storedCode = await VerificationCode.findOne({ email: email.toLowerCase() });
    if (!storedCode) return res.status(400).json({ message: 'No verification code found' });

    if (new Date() > storedCode.expiresAt) {
      await VerificationCode.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (storedCode.code !== code) return res.status(400).json({ message: 'Invalid verification code' });

    await VerificationCode.deleteOne({ email: email.toLowerCase() }); // Remove used code
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'Failed to verify code' });
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find the client by email
    const client = await Clients.findOne({ email });

    if (!client) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // // Check if the account is active
    // if (client.status !== 'Active') {
    //   return res.status(403).json({ error: 'Account is not active' });
    // }

    // Verify the password
    const isValidPassword = await bcrypt.compare(password, client.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate a JWT token for the client
    const token = jwt.sign(
      { id: client._id, email: client.email, role: 'client', name: client.name },
      JWT_SECRET,
      { expiresIn: '3d' }
    );

    res.json({
      message: 'Client login successful',
      token,
      client: {
        id: client._id,
        email: client.email,
        name: client.name,
      },
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Fetch all client emails
router.get('/show', async (req, res) => {
  try {
    // Fetch clients with only required fields (email and id)
    const clients = await Clients.find({}, 'email _id name status');

    // Filter only active clients (optional, depending on your requirements)
    const activeClients = clients.filter(client => client.status === 'Active');

    res.status(200).json({
      message: 'Clients fetched successfully',
      clients: activeClients.map(client => ({
        id: client._id,
        email: client.email,
        name: client.name,
        status: client.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post("/register", async (req, res) => {
  const { email, password, name, phone, company, address } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    // Check if client already exists
    const existingClient = await Clients.findOne({ email });
    if (existingClient) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique clientId
    const clientId = new mongoose .Types.ObjectId().toString();

    // Create a new client
    const newClient = new Clients({
      clientId,
      email,
      password: hashedPassword,
      name,
      phone,
      company,
      address,
      status: "Non-active", // Default status
    });

    // Save client to database
    await newClient.save();

    // Generate JWT Token
    const token = jwt.sign(
      { id: newClient._id, email: newClient.email, role: "client", name: newClient.name },
      JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.status(201).json({
      message: "Client registered successfully",
      token,
      client: {
        id: newClient._id,
        email: newClient.email,
        name: newClient.name,
        status: newClient.status,
      },
    });
  } catch (error) {
    console.error("Client registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex")
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour

    await user.save()

    // Send reset email
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`
    await sendResetPasswordEmail(user.email, resetUrl)

    res.status(200).json({ message: "Password reset email sent" })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

module.exports = router;
