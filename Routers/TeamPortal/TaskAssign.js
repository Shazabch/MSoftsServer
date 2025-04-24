const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Task } = require('../../Models/Task');
const { authenticate } = require('../../Middlewere/Teamportalauth');
const ClientProjects = require('../../Models/ClientProjects'); // Corrected import statement

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
router.patch('/move-status/:taskid', authenticate, async (req, res) => {
  const { taskIds, newStatus } = req.body;
  
  // Validate required fields
  if (!taskIds || !newStatus) {
    return res.status(400).json({ 
      message: 'Missing required fields: taskIds and newStatus are required' 
    });
  }
  
  // Validate status value
  const validStatuses = ['todo', 'in-progress', 'review', 'done'];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ 
      message: `Invalid status. Status must be one of: ${validStatuses.join(', ')}` 
    });
  }

  try {
    // Handle both single ID and array of IDs
    const ids = Array.isArray(taskIds) ? taskIds : [taskIds];
    
    // Find and update all specified tasks
    const updateResults = await Promise.all(
      ids.map(async (id) => {
        const task = await Task.findOne({ id });
        
        if (!task) {
          return { id, success: false, message: 'Task not found' };
        }
        
        // Update the status
        task.status = newStatus;
        await task.save();
        
        return { 
          id, 
          success: true, 
          task
        };
      })
    );
    
    // Count successful updates
    const successCount = updateResults.filter(result => result.success).length;
    
    if (successCount === 0) {
      return res.status(404).json({ 
        message: 'No tasks were updated', 
        results: updateResults 
      });
    }
    
    res.json({
      message: `Successfully moved ${successCount} task(s) to ${newStatus} status`,
      results: updateResults
    });
    
  } catch (error) {
    console.error('Error moving tasks:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * Bulk move tasks between statuses
 * Allows moving multiple tasks with specified source and target statuses
 */
router.patch('/bulk-move-status', authenticate, async (req, res) => {
  const { fromStatus, toStatus, projectId } = req.body;
  
  // Validate required fields
  if (!fromStatus || !toStatus) {
    return res.status(400).json({ 
      message: 'Missing required fields: fromStatus and toStatus are required' 
    });
  }
  
  // Validate status values
  const validStatuses = ['todo', 'in-progress', 'review', 'done'];
  if (!validStatuses.includes(fromStatus) || !validStatuses.includes(toStatus)) {
    return res.status(400).json({ 
      message: `Invalid status. Status must be one of: ${validStatuses.join(', ')}` 
    });
  }

  try {
    // Build query with optional project filter
    const query = { status: fromStatus };
    if (projectId) {
      query.project = projectId;
    }
    
    // Find all matching tasks and update them
    const result = await Task.updateMany(
      query,
      { $set: { status: toStatus } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        message: `No tasks found with status '${fromStatus}'${projectId ? ' in the specified project' : ''}` 
      });
    }
    
    res.json({
      message: `Successfully moved ${result.modifiedCount} task(s) from '${fromStatus}' to '${toStatus}'`,
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('Error bulk moving tasks:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});
module.exports = router;