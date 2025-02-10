const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Client = require('../Models/ClientProfileModel');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'client_avatars',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'fill' }]
  }
});

const upload = multer({ storage: storage });

// Get client profile
router.get('/profile',  async (req, res) => {
  try {
    const client = await Client.findById(req.user.id).select('-password');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update client profile
router.put('/update-profile', async (req, res) => {
  try {
    const { name, phone, company, address } = req.body;
    
    // Find client and update
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Update fields
    if (name) client.name = name;
    if (phone) client.phone = phone;
    if (company) client.company = company;
    if (address) client.address = address;

    await client.save();
    
    // Return updated client without password
    const updatedClient = await Client.findById(req.user.id).select('-password');
    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload avatar
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // If there's an existing avatar, delete it from Cloudinary
    if (client.avatar && client.avatar.includes('cloudinary')) {
      const publicId = client.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`client_avatars/${publicId}`);
    }

    // Update client with new avatar URL
    client.avatar = req.file.path;
    await client.save();

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatarUrl: req.file.path
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;