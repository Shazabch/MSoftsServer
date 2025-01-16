const mongoose = require('mongoose');

const subAdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  permissions: { type: [String], required: true },
  role: { type: String, required: false }, // Role should remain a string
});


module.exports = mongoose.model('SubAdmin', subAdminSchema);
