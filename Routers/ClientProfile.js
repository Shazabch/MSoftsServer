const express = require('express');
const router = express.Router();
const multer = require('multer');
const Client = require('../Models/Clients');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dybotqozo",
  api_key: "176444681733414",
  api_secret: "Iio2fclIU0VyxjD1iE_qW2tbxTg"
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'client_profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Resize images if needed
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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
router.put('/update/:id', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🔄 [UPDATE REQUEST] Client ID:', req.params.id);
    console.log('📩 [REQUEST BODY]:', req.body);
    console.log('📁 [UPLOADED FILES]:', req.files);

    // Get the current client data
    const currentClient = await Client.findById(req.params.id);
    if (!currentClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const updateData = { ...req.body };

    // Handle file uploads
    if (req.files) {
      // Handle avatar upload
      if (req.files.avatar) {
        // Delete old avatar from Cloudinary if it exists
        if (currentClient.avatar) {
          const publicId = currentClient.avatar.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`client_profiles/${publicId}`);
        }
        updateData.avatar = req.files.avatar[0].path;
        console.log('🖼️ [NEW AVATAR UPLOADED]:', updateData.avatar);
      }

      // Handle cover image upload
      if (req.files.coverImage) {
        // Delete old cover image from Cloudinary if it exists
        if (currentClient.coverImage) {
          const publicId = currentClient.coverImage.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`client_profiles/${publicId}`);
        }
        updateData.coverImage = req.files.coverImage[0].path;
        console.log('🖼️ [NEW COVER IMAGE UPLOADED]:', updateData.coverImage);
      }
    }

    // Prevent updating email and name
    delete updateData.email;
    delete updateData.name;

    console.log('📝 [FINAL UPDATE DATA]:', updateData);

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
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