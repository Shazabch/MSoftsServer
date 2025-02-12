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
  },
  role: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Message', messageSchema);