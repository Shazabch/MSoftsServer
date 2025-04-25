const express = require('express');
const router = express.Router();
const { Task, ActivityLog, TaskFlowTeam } = require('../../Models/Task');
const { authenticate } = require('../../Middlewere/Teamportalauth');

// Get task by ID with detailed information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the task by the custom string ID field
    const task = await Task.findOne({ id: id });
      
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Manually populate the assignee data
    let populatedTask = task.toObject();
    
    if (task.assignee) {
      const assignee = await TaskFlowTeam.findOne({ id: task.assignee }, 'id name email');
      if (assignee) {
        populatedTask.assignee = assignee;
      }
    }
    
    // Manually populate the project data if needed
    if (task.project) {
      // Assuming you have a Project model or similar
      // const project = await Project.findOne({ id: task.project }, 'id name');
      // if (project) {
      //   populatedTask.project = project;
      // }
    }
    
    // Get activity history - also by the string ID
    const activityHistory = await ActivityLog.find({ taskId: id })
      .sort({ createdAt: -1 });
    
    // Manually populate user data in activity history
    const populatedActivityHistory = await Promise.all(
      activityHistory.map(async (activity) => {
        const activityObj = activity.toObject();
        const user = await TaskFlowTeam.findOne({ id: activity.userId }, 'id name email');
        if (user) {
          activityObj.user = user;
        }
        return activityObj;
      })
    );
    
    res.json({
      task: populatedTask,
      activityHistory: populatedActivityHistory
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to task
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Find task by string ID
    const task = await Task.findOne({ id: id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = {
      content,
      userId,
      createdAt: new Date()
    };

    task.comments.push(comment);
    await task.save();

    // Log activity
    await ActivityLog.create({
      taskId: id,
      userId,
      action: 'comment',
      details: { content }
    });

    // Respond with the comment and the user info
    const user = await TaskFlowTeam.findOne({ id: userId }, 'id name email');
    const commentWithUser = {
      ...comment,
      user
    };

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;