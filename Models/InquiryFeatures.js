const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema({
  inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inquiry", required: true },
  features: { type: [String], required: true },  // Array of feature strings
});

module.exports = mongoose.model("Feature", featureSchema);
