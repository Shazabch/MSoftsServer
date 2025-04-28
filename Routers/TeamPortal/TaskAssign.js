const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Task, TaskFlowTeam } = require('../../Models/Task');
const { authenticate } = require('../../Middlewere/Teamportalauth');
const TaskFlowProject = require('../../Models/TaskFlowProjects');
const jwt = require('jsonwebtoken');

router.get('/show', authenticate, async (req, res) => {
  try {
    const { project, assigneeEmail } = req.query;
    // console.log('Query parameters:', req.query);
        let query = {};
        const userRole = req.user?.role || 'user';
    // console.log('User role:', userRole);


    if (userRole === 'admin' || userRole === 'superadmin') {
      if (assigneeEmail) {
        if (assigneeEmail.startsWith('eyJ')) {
          try {
            const decoded = jwt.verify(assigneeEmail, process.env.JWT_SECRET);
            // console.log('Decoded token:', decoded);
                        if (decoded.email !== req.user.email) {
              query.assignee = decoded.email;
            }            
          } catch (tokenError) {
            console.error('Invalid token:', tokenError);
            return res.status(400).json({ message: 'Invalid token provided as assigneeEmail' });
          }
        } else if (assigneeEmail !== req.user.email) {
          query.assignee = assigneeEmail;
        }
      }
    } else {
      query.assignee = req.user.email;
      // console.log('User role is regular user, filtering by their email:', req.user.email);
    }
    
    // console.log('Final query:', query);
    const tasks = await Task.find(query);
    res.json(tasks);
    // console.log(`Tasks fetched successfully: ${tasks.length} tasks found`);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.post('/add', authenticate, async (req, res) => {
  let { title, description, status, assignee, project, priority } = req.body;
  
  try {
    // Validate if project exists (if provided)
    if (project) {
      const projectExists = await TaskFlowProject.findById(project);
      if (!projectExists) {
        return res.status(400).json({ message: 'Project not found' });
      }
    }

    // If assignee is a UUID, convert it to email
    if (assignee && assignee.trim() !== '') {
      // console.log('new Assignee provided:', assignee);
      
      // Check if it's a UUID format (simplified check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(assignee)) {
        // It's a UUID, so look up the user's email
        const user = await TaskFlowTeam.findOne({ id: assignee });
        if (!user) {
          return res.status(400).json({ message: 'User not found with the provided ID' });
        }
        // Replace the assignee with the email
        assignee = user.email;
      } else {
        // Check if it's a valid email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(assignee)) {
          return res.status(400).json({ message: 'Invalid format for assignee. Must be a valid email or user ID' });
        }
      }
      
      // Verify the email exists in the system
      const userExists = await TaskFlowTeam.findOne({ email: assignee });
      if (!userExists) {
        console.warn(`Warning: Assigning task to email ${assignee} which is not registered in the system`);
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
      const projectExists = await TaskFlowProject.findById(project);
      if (!projectExists) {
        return res.status(400).json({ message: 'Project not found' });
      }
    }
    
    // Validate assignee email if provided
    if (assignee !== undefined && assignee !== task.assignee) {
      const userExists = await TaskFlowTeam.findOne({ email: assignee });
      if (!userExists && assignee !== null) {
        return res.status(400).json({ message: 'Assignee user not found' });
      }
    }
    
    // Update task fields if provided
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (assignee !== undefined) task.assignee = assignee; // Store email directly
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
    const projects = await TaskFlowProject.find({})
      .select('_id name clientEmail status progress')
      .sort({ lastUpdate: -1 });
    
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects", details: error.message });
  }
});

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