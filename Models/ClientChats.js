const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderEmail: {
    type: String,
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', messageSchema);