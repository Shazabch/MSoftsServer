const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Task, TaskFlowTeam } = require('../../Models/Task');
const { authenticate } = require('../../Middlewere/Teamportalauth');
const ClientProjects = require('../../Models/ClientProjects');
const jwt = require('jsonwebtoken'); // Make sure jwt is imported

router.get('/show', authenticate, async (req, res) => {
  try {
    const { project, assigneeEmail } = req.query;
    console.log('Query parameters:', req.query);
    console.log('Project:', project);
    
    // Build the query object
    let query = {};
    
    // If project ID is provided, filter tasks by project
    if (project) {
      query.project = project;
    }
    
    // If assigneeEmail is provided, handle it appropriately
    if (assigneeEmail) {
      // Check if it's a JWT token
      if (assigneeEmail.startsWith('eyJ')) {
        try {
          // Decode the JWT token (use the same secret that you use for authentication)
          const decoded = jwt.verify(assigneeEmail, process.env.JWT_SECRET); // Replace with your actual secret
          
          // Use the email from the decoded token
          const user = await TaskFlowTeam.findOne({ email: decoded.email });
          if (user) {
            query.assignee = user.id;
          } else {
            return res.json([]);
          }
        } catch (tokenError) {
          console.error('Invalid token:', tokenError);
          return res.status(400).json({ message: 'Invalid token provided as assigneeEmail' });
        }
      } else {
        // Handle as regular email
        const user = await TaskFlowTeam.findOne({ email: assigneeEmail });
        if (user) {
          query.assignee = user.id;
        } else {
          return res.json([]);
        }
      }
    }
    
    const tasks = await Task.find(query);
    res.json(tasks);
    console.log('Tasks fetched successfully:', tasks);
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

// Fixed route to correctly handle the taskId parameter
router.patch('/move-status/:taskid', authenticate, async (req, res) => {
  const taskId = req.params.taskid;
  const { taskIds, newStatus } = req.body;
  
  // Use the URL parameter if taskIds is not provided in the body
  const idsToProcess = taskIds || taskId;
  
  // Validate status value
  const validStatuses = ['todo', 'inProgress', 'inReview', 'done'];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ 
      message: `Invalid status. Status must be one of: ${validStatuses.join(', ')}` 
    });
  }

  try {
    // Handle both single ID and array of IDs
    const ids = Array.isArray(idsToProcess) ? idsToProcess : [idsToProcess];
    
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
    console.log('Error moving tasks:', error.message);
    console.error('Error moving tasks:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;