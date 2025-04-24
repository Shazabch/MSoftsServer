const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Task } = require('../../Models/Task');
const { authenticate } = require('../../Middlewere/Teamportalauth');
const ClientProjects = require('../../Models/ClientProjects'); // Corrected import statement

/**
 * @route GET /team/task/show
 * @desc Get tasks, optionally filtered by project ID
 * @access Private
 */
router.get('/show', authenticate, async (req, res) => {
  try {
    const { project } = req.query;
    
    // If project ID is provided, filter tasks by project
    const query = project ? { project } : {};
    
    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /team/task/add
 * @desc Create a new task
 * @access Private
 */
router.post('/add', authenticate, async (req, res) => {
  const { title, description, status, assignee, project, priority } = req.body;
  
  try {
    // Validate if project exists (if provided)
    if (project) {
      const projectExists = await ClientProjects.findById(project);
      if (!projectExists) {
        return res.status(400).json({ message: 'Project not found' });
      }
    }
    
    const newTask = new Task({
      id: uuidv4(),
      title,
      description,
      status: status || 'todo',
      assignee,
      project,
      priority: priority || 'low',
      createdAt: new Date().toISOString()
    });
    
    await newTask.save();
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /team/task/update/:id
 * @desc Update an existing task
 * @access Private
 */
router.put('/update/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, assignee, project, priority } = req.body;
  
  try {
    const task = await Task.findOne({ id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Validate if project exists (if being updated)
    if (project && project !== task.project) {
      const projectExists = await ClientProjects.findById(project);
      if (!projectExists) {
        return res.status(400).json({ message: 'Project not found' });
      }
    }
    
    // Update task fields if provided
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (assignee !== undefined) task.assignee = assignee;
    if (project) task.project = project;
    if (priority) task.priority = priority;
    
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route DELETE /team/task/del/:id
 * @desc Delete a task
 * @access Private
 */
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
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /team/task/project-search
 * @desc Get all projects for task assignment (frontend will handle filtering)
 * @access Private
 */
router.get('/project-search', authenticate, async (req, res) => {
  try {
    // Get all projects without filtering
    const projects = await ClientProjects.find({})
      .select('_id name clientEmail status progress')
      .sort({ lastUpdate: -1 });
    
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects", details: error.message });
  }
});

module.exports = router;