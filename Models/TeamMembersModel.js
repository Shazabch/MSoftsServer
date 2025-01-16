const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false, // Make imageUrl optional
  },
});

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);

module.exports = TeamMember;
