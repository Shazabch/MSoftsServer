const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Notification Model
const Notification = require('../Models/Notifications');

// Email Utility
const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use the email service of your choice
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD, // Your email password (or app password)
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Middleware to authenticate user (you may already have one)
const authenticateUser = (req, res, next) => {
  if (!req.client) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get all notifications for the logged-in user
router.get('/notifications', authenticateUser, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// Mark a notification as read
router.put('/notifications/:id/read', authenticateUser, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Error updating notification' });
  }
});

// Request progress and create notification
router.post("/request-progress", authenticateUser, async (req, res) => {
 try {
   const {
    clientId,
     projectId,
     projectName,
     message,
     projectDescription,
     lastUpdate,
     progress,
   } = req.body;

   if (!req.client) {
    console.log("No client data found");
     return res.status(401).json({ error: "Unauthorized: No client data found" });
   }

   console.log("Received progress request:", {
     clientId,
     projectId,
     projectName,
     projectDescription,
     message,
     lastUpdate,
     progress,
   });

   // Create a new notification with the exact details from frontend
   const notification = await Notification.create({
     clientId,
     projectId,
     projectName,
     projectDescription,
     message,
     lastUpdate,
     progress,
   });

   console.log("Notification saved:", notification);

   res.status(201).json({ success: true, notification });
 } catch (error) {
   console.error("Error saving progress request:", error);
   res.status(500).json({ error: "Error saving progress request" });
 }
});


module.exports = router;
