const mongoose = require("mongoose")

const clientsSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: String,
  phone: String,
  company: String,
  address: String,
  status: {
    type: String,
    enum: ["Active", "Non-active"],
    default: "Non-active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Clients", clientsSchema)