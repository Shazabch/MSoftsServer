const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Task } = require('../../Models/Task');
const { authenticate } = require('../../Middlewere/Teamportalauth');

// Get all tasks
router.get('/show', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new task
router.post('/add', authenticate, async (req, res) => {
  const { title, description, status, assignee, project } = req.body;
  
  try {
    const newTask = new Task({
      id: uuidv4(),
      title,
      description,
      status: status || 'todo',
      assignee,
      project: project || 'default-project'
    });
    
    await newTask.save();
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task
router.put('/update/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, assignee, project } = req.body;
  
  try {
    const task = await Task.findOne({ id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (assignee) task.assignee = assignee;
    if (project) task.project = project;
    
    await task.save();
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete task
router.delete('/del/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  
  try {
    const task = await Task.findOne({ id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await Task.deleteOne({ id });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;