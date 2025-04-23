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
    enum: ['todo', 'inProgress', 'completed'],
    default: 'todo'
  },
  assignee: {
    type: String,
    ref: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  project: {
    type: String,
    default: 'default-project'
  }
}, { timestamps: true });

const TaskFlowTeam = mongoose.model('TaskFlowTeam', userSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = { TaskFlowTeam, Task };