const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  }
}, { timestamps: true });

// Define a comment schema
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'TaskFlowTeam'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    // required: true
  },
  status: {
    type: String,
    enum: ['todo', 'inProgress', 'inReview', 'done'],
    default: 'todo'
  },
  // Updated to support multiple assignees
  assignees: [{
    type: String, // Store email addresses
    ref: 'TaskFlowTeam'
  }],
  assignee: {
    type: String,
    ref: 'TaskFlowTeam'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'low'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  project: {
    type: String,
    default: 'default-project'
  },
  assignedToAllMembers: {
    type: Boolean,
    default: false
  },
  timeTracking: {
    totalTime: {
      type: Number,
      default: 0
    },
    sessions: [{
      startTime: Date,
      endTime: Date,
      duration: Number
    }]
  },
  comments: [commentSchema]
}, { timestamps: true });

const TaskFlowTeam = mongoose.model('TaskFlowTeam', userSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = { TaskFlowTeam, Task };