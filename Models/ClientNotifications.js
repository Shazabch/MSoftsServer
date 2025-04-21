const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
 userEmail: {
   type: String,
   required: true
 },
 title: { 
   type: String,
   required: true
 },
 message: {
   type: String,
   required: true
 },
 type: {
   type: String,
   enum: ['info', 'success', 'warning', 'error'],
   default: 'info'
 },
 read: {
   type: Boolean,
   default: false
 },
 timestamp: {
   type: Date,
   default: Date.now
 }
});

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
