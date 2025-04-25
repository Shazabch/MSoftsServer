// Update Task Schema
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Activity Log Schema
const activityLogSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    ref: 'Task'
  },
  userId: {
    type: String,
    required: true,
    ref: 'TaskFlowTeam'
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'comment', 'status_change', 'assigned']
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Comment Schema
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

// Task Schema
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
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'inProgress', 'inReview', 'done'],
    default: 'todo'
  },
  assignee: {
    type: String,  // Keep as String since you're storing UUIDs
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
    type: String,  // Make sure this is String if you're storing a UUID
    default: 'default-project'
  },
  comments: [commentSchema],
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
  }
}, { timestamps: true });

const TaskFlowTeam = mongoose.model('TaskFlowTeam', userSchema);
const Task = mongoose.model('Task', taskSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = { TaskFlowTeam, Task, ActivityLog };