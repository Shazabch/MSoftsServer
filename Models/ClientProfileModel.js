const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  status: {
    type: String,
    enum: ['Active', 'Non-active'],
    default: 'Non-active'
  }
}, {
  timestamps: true
});

// Remove password when converting to JSON
clientSchema.methods.toJSON = function() {
  const client = this.toObject();
  delete client.password;
  return client;
};

module.exports = mongoose.model('ClientProfile', clientSchema);