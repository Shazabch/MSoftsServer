const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const nodemailer = require("nodemailer")
const socketManager = require("../Socket.io/Socket")
const Notification = require("../Models/Notifications")

// 📌 **Email Utility Function**
const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    const mailOptions = { from: process.env.EMAIL_USER, to, subject, text }
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error("Error sending email:", error)
  }
}

// 📌 **Middleware to Authenticate User**
const authenticateUser = (req, res, next) => {
  if (!req.client) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
}

// 📌 **Get All Unread Notifications for Admin**
router.get("/admin/show", async (req, res) => {
  try {
    const notifications = await Notification.find({ markAsRead: false }).sort({ createdAt: -1 })
    res.status(200).json(notifications)
  } catch (error) {
    console.error("Error fetching unread notifications:", error)
    res.status(500).json({ error: "Failed to fetch unread notifications" })
  }
})

// 📌 **Get All Notifications (Read & Unread)**
router.get("/admin/all", async (req, res) => {
 try {
   // 🔥 Fetch all notifications (both read & unread)
   const notifications = await Notification.find().sort({ createdAt: -1 })

   res.status(200).json(notifications)
 } catch (error) {
   console.error("Error fetching notifications:", error)
   res.status(500).json({ error: "Failed to fetch notifications" })
 }
})


// 📌 **Mark Single Notification as Read**
router.patch("/admin/mark/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { markAsRead: true },
      { new: true }
    )

    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found" })
    }

    res.status(200).json(updatedNotification)
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({ error: "Failed to mark notification as read" })
  }
})

// 📌 **Mark All Notifications as Read**
router.patch("/admin/mark-all", async (req, res) => {
  try {
    const notifications = req.body.notifications
    if (!notifications || notifications.length === 0) {
      return res.status(400).json({ error: "No notifications provided" })
    }

    const notificationIds = notifications.map((n) => n._id)

    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, markAsRead: false },
      { $set: { markAsRead: true } }
    )

    if (result.modifiedCount > 0) {
      const io = socketManager.getIO()
      io.emit("notifications_updated")
      res.json({ message: "Notifications marked as read successfully" })
    } else {
      res.status(400).json({ error: "No notifications were updated" })
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    res.status(500).json({ error: "Something went wrong" })
  }
})

// 📌 **Client Request Progress & Create Notification**
router.post("/request-progress", authenticateUser, async (req, res) => {
  try {
    const { clientId, clientName, projectId, projectName, message, projectDescription, lastUpdate, progress } = req.body

    if (!req.client) {
      return res.status(401).json({ error: "Unauthorized: No client data found" })
    }

    const notification = await Notification.create({
      clientId,
      clientName,
      projectId,
      projectName,
      projectDescription,
      message,
      lastUpdate,
      progress,
      markAsRead: false,
    })

    const io = socketManager.getIO()
    io.emit("new_notification", notification)

    res.status(201).json({ success: true, notification })
  } catch (error) {
    console.error("Error saving progress request:", error)
    res.status(500).json({ error: "Error saving progress request" })
  }
})

module.exports = router
