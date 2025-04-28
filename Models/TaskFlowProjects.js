// models/TaskFlowProject.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TaskFlowProjectSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold', 'cancelled', 'archived'],
    default: 'active'
  },
  members: [{
    type: String,
    ref: 'User'
  }],
  // New field to store the client project reference
  clientProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clientProjects'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Format timestamps and id for frontend
TaskFlowProjectSchema.methods.toJSON = function() {
  const project = this.toObject();
  project.createdAt = project.createdAt.toISOString();
  project.updatedAt = project.updatedAt.toISOString();
  return project;
};

// Pre-save middleware to update timestamps
TaskFlowProjectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('TaskFlowProject', TaskFlowProjectSchema);