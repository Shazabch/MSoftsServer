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
    
    // For admin users, show all tasks if no assignee filter is provided
    if (userRole === 'admin' || userRole === 'superadmin') {
      if (assigneeEmail) {
        let userEmailToMatch = req.user.email;
        
        if (assigneeEmail.startsWith('eyJ')) {
          try {
            const decoded = jwt.verify(assigneeEmail, process.env.JWT_SECRET);
            // console.log('Decoded token:', decoded);
            
            if (decoded.email !== req.user.email) {
              userEmailToMatch = decoded.email;
            }
            
          } catch (tokenError) {
            console.error('Invalid token:', tokenError);
            return res.status(400).json({ message: 'Invalid token provided as assigneeEmail' });
          }
        } else if (assigneeEmail !== req.user.email) {
          userEmailToMatch = assigneeEmail;
        }
        
        // Filter by the specified assignee
        query = {
          $or: [
            { assignee: userEmailToMatch },
            { assignees: { $in: [userEmailToMatch] } }
          ]
        };
      }
    } else {
      // console.log('User role is regular user, filtering by their email:', req.user.email);
      query = {
        $or: [
          { assignee: req.user.email },
          { assignees: { $in: [req.user.email] } }
        ]
      };
    }
    
    // if (project && project !== 'default-project') {
    //   query.project = project;
    // }
    
    // console.log('Final query:', query);
    const tasks = await Task.find(query);
    res.json(tasks);
    console.log(`Tasks fetched successfully: ${tasks.length} tasks found`);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/add', authenticate, async (req, res) => {
  let { title, description, status, assignees, project, priority, assignToAllMembers } = req.body;
  
  try {
    // Validate if project exists (if provided)
    if (project) {
      const projectExists = await TaskFlowProject.findById(project);
      if (!projectExists) {
        return res.status(400).json({ message: 'Project not found' });
      }
      
      // If assignToAllMembers is true, get all project members
      if (assignToAllMembers) {
        try {
          // Fetch project members
          const projectMembers = await getProjectMembers(project);
          
          if (!projectMembers || projectMembers.length === 0) {
            return res.status(400).json({ message: 'No members found in the project' });
          }
          
          // Use member emails as assignees
          assignees = projectMembers.map(member => member.email);
        } catch (memberError) {
          console.error('Error fetching project members:', memberError);
          return res.status(500).json({ message: 'Failed to fetch project members', error: memberError.message });
        }
      }
    }

    // Handle compatibility with single assignee (backward compatibility)
    let singleAssignee = null;
    let finalAssignees = [];
    
    // Process assignees if provided
    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      finalAssignees = [];
      
      // Validate all assignees
      for (const assignee of assignees) {
        // Check if it's a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(assignee)) {
          // It's a UUID, so look up the user's email
          const user = await TaskFlowTeam.findOne({ id: assignee });
          if (!user) {
            return res.status(400).json({ message: `User not found with the provided ID: ${assignee}` });
          }
          // Add the email to finalAssignees
          finalAssignees.push(user.email);
        } else {
          // Check if it's a valid email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(assignee)) {
            return res.status(400).json({ 
              message: `Invalid format for assignee: ${assignee}. Must be a valid email or user ID` 
            });
          }
          finalAssignees.push(assignee);
        }
      }
      
      // Store the first assignee in the singular field for backward compatibility
      singleAssignee = finalAssignees.length > 0 ? finalAssignees[0] : null;
      
    } else if (req.body.assignee) {
      // Handle single assignee from the old format
      let assignee = req.body.assignee;
      
      if (assignee && assignee.trim() !== '') {
        // Check if it's a UUID
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
        
        singleAssignee = assignee;
        finalAssignees = [assignee];
      }
    }
    
    const newTask = new Task({
      id: uuidv4(),
      title,
      description,
      status: status || 'todo',
      assignee: singleAssignee, // For backward compatibility
      assignees: finalAssignees, // New field for multiple assignees
      project,
      priority: priority || 'low',
      assignedToAllMembers: assignToAllMembers || false,
      createdAt: new Date().toISOString()
    });
    
    await newTask.save();
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Update task route - update to support multiple assignees
router.put('/update/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, assignee, assignees, project, priority, assignToAllMembers } = req.body;
  
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
    
    // Handle assignToAllMembers
    let finalAssignees = task.assignees || [];
    let singleAssignee = task.assignee;
    
    if (assignToAllMembers) {
      try {
        // Get all project members for the current project
        const projectId = project || task.project;
        const projectMembers = await getProjectMembers(projectId);
        
        if (!projectMembers || projectMembers.length === 0) {
          return res.status(400).json({ message: 'No members found in the project' });
        }
        
        // Use member emails as assignees
        finalAssignees = projectMembers.map(member => member.email);
        singleAssignee = finalAssignees[0]; // Set first member as single assignee for backward compatibility
      } catch (memberError) {
        console.error('Error fetching project members:', memberError);
        return res.status(500).json({ message: 'Failed to fetch project members', error: memberError.message });
      }
    }
    // If assignees are provided and not using assignToAllMembers
    else if (assignees !== undefined) {
      // Process the provided assignees
      finalAssignees = [];
      
      if (Array.isArray(assignees) && assignees.length > 0) {
        for (const assignee of assignees) {
          // Check if it's a UUID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          if (uuidRegex.test(assignee)) {
            // It's a UUID, so look up the user's email
            const user = await TaskFlowTeam.findOne({ id: assignee });
            if (!user) {
              return res.status(400).json({ message: `User not found with the provided ID: ${assignee}` });
            }
            finalAssignees.push(user.email);
          } else {
            // Check if it's a valid email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(assignee)) {
              return res.status(400).json({ 
                message: `Invalid format for assignee: ${assignee}. Must be a valid email or user ID` 
              });
            }
            finalAssignees.push(assignee);
          }
        }
        
        // Set first assignee as the single assignee for backward compatibility
        singleAssignee = finalAssignees.length > 0 ? finalAssignees[0] : null;
      } else {
        // No assignees or empty array
        finalAssignees = [];
        singleAssignee = null;
      }
    }
    // If only single assignee is provided (backward compatibility)
    else if (assignee !== undefined) {
      let processedAssignee = assignee;
      
      if (assignee === null) {
        // Clear assignees if assignee is explicitly set to null
        singleAssignee = null;
        finalAssignees = [];
      } else {
        // Validate the assignee if provided
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(assignee)) {
          // It's a UUID, look up the user
          const user = await TaskFlowTeam.findOne({ id: assignee });
          if (!user) {
            return res.status(400).json({ message: 'Assignee user not found' });
          }
          processedAssignee = user.email;
        } else if (!emailRegex.test(assignee)) {
          return res.status(400).json({ message: 'Invalid format for assignee. Must be a valid email or user ID' });
        }
        
        singleAssignee = processedAssignee;
        // Update assignees array to match single assignee
        finalAssignees = [processedAssignee];
      }
    }
    
    // Update task fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (project) task.project = project;
    if (priority) task.priority = priority;
    
    // Update assignees
    task.assignees = finalAssignees;
    task.assignee = singleAssignee;
    task.assignedToAllMembers = assignToAllMembers || false;
    
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

// Helper function to get project members
async function getProjectMembers(projectId) {
  try {
    // Assuming you have a method to get project members
    // This is just a placeholder - implement according to your data model
    const project = await TaskFlowProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    // If project has members field, return those members
    if (project.members && Array.isArray(project.members)) {
      // If members are stored as IDs, fetch the actual user data
      const memberPromises = project.members.map(async (memberId) => {
        return await TaskFlowTeam.findOne({ id: memberId });
      });
      
      const members = await Promise.all(memberPromises);
      return members.filter(member => member !== null); // Filter out any null results
    }
    
    // If your project structure doesn't have members directly, you might need to
    // query another collection or relationship
    
    // Example: If you have a ProjectMembers collection
    // return await ProjectMembers.find({ projectId }).populate('member');
    
    // For now, return an empty array if no members are found
    return [];
  } catch (error) {
    console.error('Error getting project members:', error);
    throw error;
  }
}

// Add project members endpoint
router.get('/project/:projectId/members', authenticate, async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const members = await getProjectMembers(projectId);
    res.json(members);
  } catch (error) {
    console.error('Error fetching project members:', error);
    res.status(500).json({ message: 'Failed to fetch project members', error: error.message });
  }
});

module.exports = router;