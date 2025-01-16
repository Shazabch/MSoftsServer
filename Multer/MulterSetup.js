const multer = require('multer');
const path = require('path');

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'Uploads')); // Store files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the filename to avoid overwriting
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage });

// Export upload for use in routes
module.exports = upload;
