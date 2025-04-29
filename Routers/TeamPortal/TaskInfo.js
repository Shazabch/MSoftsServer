const express = require('express');
const router = express.Router();
const { Task, TaskFlowTeam } = require('../../Models/Task');
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
    
    // Populate user information for comments
    if (populatedTask.comments && populatedTask.comments.length > 0) {
      const userIds = [...new Set(populatedTask.comments.map(comment => comment.userId))];
      const users = await TaskFlowTeam.find({ id: { $in: userIds } }, 'id name email');
      
      // Create a map for quick user lookup
      const userMap = users.reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {});
      
      // Add user details to each comment
      populatedTask.comments = populatedTask.comments.map(comment => ({
        ...comment,
        user: userMap[comment.userId] || { id: comment.userId }
      }));
    }
    
    res.json({
      task: populatedTask,
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
    
    // Create a new comment
    const comment = {
      content,
      userId,
      createdAt: new Date()
    };
    
    // Add comment to the task's comments array
    task.comments.push(comment);
    await task.save();
    
    // Get user details to return in response
    const user = await TaskFlowTeam.findOne({ id: userId }, 'id name email');
    
    // Format the response
    const commentWithUser = {
      ...task.comments[task.comments.length - 1].toObject(),
      user: user ? user.toObject() : { id: userId }
    };
    
    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all comments for a task
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find task by string ID
    const task = await Task.findOne({ id: id }, 'comments');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (!task.comments || task.comments.length === 0) {
      return res.json({ comments: [] });
    }
    
    // Get all unique user IDs from comments
    const userIds = [...new Set(task.comments.map(comment => comment.userId))];
    
    // Fetch user details
    const users = await TaskFlowTeam.find({ id: { $in: userIds } }, 'id name email');
    const userMap = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});
    
    // Add user details to each comment
    const commentsWithUsers = task.comments.map(comment => {
      const commentObj = comment.toObject();
      return {
        ...commentObj,
        user: userMap[comment.userId] || { id: comment.userId }
      };
    });
    
    res.json({ comments: commentsWithUsers });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;