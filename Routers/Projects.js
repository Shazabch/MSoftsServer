const express = require('express');
const Project = require('../Models/ProjectsModel');
const upload = require('../Multer/MulterSetup');  // Import multer setup
const router = express.Router();

// POST route to add a new project with image upload
router.post('/add', upload.single('image'), async (req, res) => {
  try {
    const { title, description, technologies, liveUrl, category } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : ''; // If image is uploaded, get its path

    const newProject = new Project({
      title,
      description,
      image,  // Store the image path
      technologies: technologies.split(','),
      liveUrl,
      category,
    });

    await newProject.save();
    res.status(201).json({ message: 'Project added successfully', project: newProject });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ message: 'Failed to add project', error: error.message });
  }
});

// GET route to fetch all projects or filter by category
router.get('/show', async (req, res) => {
  const { category } = req.query;

  try {
    let projects;

    if (category) {
      // If category is specified, filter projects by category
      projects = await Project.find({ category });
    } else {
      // If no category is specified, fetch all projects
      projects = await Project.find();
    }

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
});

// PUT route to update a project by its ID
router.put('/update/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, description, technologies, liveUrl, category } = req.body;
  
  let updatedData = {
    title,
    description,
    technologies: technologies.split(','),
    liveUrl,
    category,
  };

  // If new image is uploaded, update the image path
  if (req.file) {
    updatedData.image = `/uploads/${req.file.filename}`;
  }

  try {
    const updatedProject = await Project.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project updated successfully', project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
});
router.get('/count', async (req, res) => {
 try {
   const projectCount = await Project.countDocuments(); // Get count of all projects
   res.json({ count: projectCount });
 } catch (error) {
   res.status(500).json({ error: 'Error fetching project count' });
 }
});
// DELETE route to delete a project by its ID
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
});

module.exports = router;
