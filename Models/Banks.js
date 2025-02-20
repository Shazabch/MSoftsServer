const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  holderName: { type: String, required: true },
  ibanNumber: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Bank", bankSchema);
