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
router.get("/admin/show",  async (req, res) => {
 try {
 
   // Fetch all notifications, sorted by newest first
   const notifications = await Notification.find().sort({ createdAt: -1 });

   res.status(200).json(notifications);
 } catch (error) {
   console.error("Error fetching notifications:", error);
   res.status(500).json({ error: "Failed to fetch notifications" });
 }
});
// Mark all notifications as read for the authenticated user
router.patch('/admin/mark-all', async (req, res) => {
 try {
   console.log("Received request body:", req.body);  // Log the request body to confirm it's correct

   const notifications = req.body.notifications;  // Access notifications array here

   if (!notifications || notifications.length === 0) {
     return res.status(400).json({ error: 'No notifications provided' });
   }

   // Extract notification IDs
   const notificationIds = notifications.map(n => n._id);
   console.log("Notification IDs to be updated:", notificationIds);  // Log notification IDs

   // Update all notifications that are not marked as read (by markAsRead)
   const result = await Notification.updateMany(
     { _id: { $in: notificationIds }, markAsRead: false },  // Change to match markAsRead
     { $set: { markAsRead: true } }  // Set markAsRead to true instead of read
   );

   console.log("Update result:", result);  // Log the result of the update operation

   if (result.modifiedCount > 0) {
     res.json({ message: 'Notifications marked as read successfully' });
   } else {
     res.status(400).json({ error: 'No notifications were updated' });
   }
 } catch (error) {
   console.error('Error marking notifications as read:', error);
   res.status(500).json({ error: 'Something went wrong' });
 }
});

// Request progress and create notification
router.post("/request-progress", authenticateUser, async (req, res) => {
 try {
   const {
    clientId,
    clientName,
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
     clientName,
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
     clientName,
     projectId,
     projectName,
     projectDescription,
     message,
     lastUpdate,
     progress,
     markAsRead: false, // Notification is unread by default

   });

   console.log("Notification saved:", notification);

   res.status(201).json({ success: true, notification });
 } catch (error) {
   console.error("Error saving progress request:", error);
   res.status(500).json({ error: "Error saving progress request" });
 }
});


module.exports = router;
