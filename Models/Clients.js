const mongoose = require('mongoose');

const clientsSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: String,
  status: {
    type: String,
    enum: ['Active', 'Non-active'],
    default: 'Non-active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Clients', clientsSchema);