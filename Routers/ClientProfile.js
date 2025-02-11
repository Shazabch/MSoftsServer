const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Client = require('../Models/Clients');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({ storage: storage });

// Get client profile by ID
router.get('/show/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      console.log(`⚠️ [NOT FOUND] Client with ID ${req.params.id} does not exist.`);
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error(`❌ [ERROR] Failed to fetch client with ID ${req.params.id}: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update client profile
router.put('/update/:id', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), async (req, res) => {
  try {
    console.log('🔄 [UPDATE REQUEST] Client ID:', req.params.id);
    console.log('📩 [REQUEST BODY]:', req.body);
    console.log('📁 [UPLOADED FILES]:', req.files);

    const updateData = { ...req.body };

    // Avatar and Cover Image Handling (if they are uploaded)
    if (req.files?.avatar) {
      updateData.avatar = req.files.avatar[0].path;
      console.log('🖼️ [NEW AVATAR UPLOADED]:', updateData.avatar);
    }

    if (req.files?.coverImage) {
      updateData.coverImage = req.files.coverImage[0].path;
      console.log('🖼️ [NEW COVER IMAGE UPLOADED]:', updateData.coverImage);
    }

    // Prevent updating email and name
    delete updateData.email;
    delete updateData.name;

    console.log('📝 [FINAL UPDATE DATA]:', updateData);

    const updatedClient = await Client.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!updatedClient) { 
      console.log(`⚠️ [NOT FOUND] Client with ID ${req.params.id} does not exist.`);
      return res.status(404).json({ message: 'Client not found' });
    }

    console.log('✅ [UPDATE SUCCESS]:', updatedClient);
    res.json(updatedClient);
  } catch (error) {
    console.error('❌ [SERVER ERROR]:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
