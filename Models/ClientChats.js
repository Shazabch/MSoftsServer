const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: String,
  filename: String,
});

const messageSchema = new mongoose.Schema({
  senderEmail: {
    type: String,
    required: true,
  },
  recipientEmail: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: function () {
      return this.attachments.length === 0; // Required only if no attachments
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    required: true,
  },
  attachments: [attachmentSchema],
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
