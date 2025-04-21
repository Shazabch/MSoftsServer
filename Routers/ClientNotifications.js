const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Notification = require('../Models/ClientNotifications'); // Adjust the path as necessary
const jwt = require('jsonwebtoken'); // For token decoding

// Helper function to get email from token
const getEmailFromToken = (token) => {
  try {
    // Remove 'Bearer ' prefix if present
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET); // Replace with your secret key
    return decoded.email;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null; 
  }
};

// Get notifications for a specific user by email from token
router.get('/show', async (req, res) => {
  try {
    // Get token from authorization header
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }
    
    // Extract email from token
    const userEmail = getEmailFromToken(token);
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Unable to extract email from token'
      });
    }
    
    // Find notifications by email instead of userId
    const notifications = await Notification.find({ userEmail })
      .sort({ timestamp: -1 })
      .limit(20); // Limit to recent 20 notifications
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications. Please try again later.'
    });
  }
});

// Mark a notification as read
router.put('/show/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification. Please try again later.'
    });
  }
});

// Mark all notifications as read for a user based on email from token
router.put('/show/read-all', async (req, res) => {
  try {
    // Get token from authorization header
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }
    
    // Extract email from token
    const userEmail = getEmailFromToken(token);
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Unable to extract email from token'
      });
    }
    
    const result = await Notification.updateMany(
      { userEmail, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      modified: result.modifiedCount,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications. Please try again later.'
    });
  }
});

// Delete a specific notification
router.delete('/show/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification. Please try again later.'
    });
  }
});

// Clear all notifications for a user based on email from token
router.delete('/show/clear-all', async (req, res) => {
  try {
    // Get token from authorization header
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }
    
    // Extract email from token
    const userEmail = getEmailFromToken(token);
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Unable to extract email from token'
      });
    }
    
    const result = await Notification.deleteMany({ userEmail });
    
    res.status(200).json({
      success: true,
      deleted: result.deletedCount,
      message: 'All notifications cleared'
    });
    
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications. Please try again later.'
    });
  }
});

module.exports = router;