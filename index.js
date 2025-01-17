const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import routes
const authRoutes = require('./Routers/Auth');
const subAdminRoutes = require('./Routers/SubAdmin');
const RolesRoutes = require('./Routers/Roles');
const testimonialRoutes = require('./Routers/Feedback');
const contactRouter = require('./Routers/ContactController');
const InquiryRouter = require('./Routers/CostInquiry');
const TeamMemberRouter = require('./Routers/TeamMember');
const BlogPostsRouter = require('./Routers/BlogsPosts');
const projectRoutes = require('./Routers/Projects');
const NewsletterRouter = require('./Routers/Newsletter');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "./Multer/Uploads")));
app.use(
 session({
   secret: process.env.SESSION_SECRET || 'defaultSecret', // Use a strong secret
   resave: false,
   saveUninitialized: false,
   store: MongoStore.create({
     mongoUrl: process.env.MONGO_URI, // MongoDB connection string
     collectionName: 'sessions',     // Optional: custom session collection name
   }),
   cookie: {
     secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
     maxAge: 1000 * 60 * 60 * 24, // 1 day
   },
 })
);
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/subadmins', subAdminRoutes);
app.use('/api/roles', RolesRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/contact', contactRouter);
app.use('/api/inquiry', InquiryRouter);
app.use('/api/team', TeamMemberRouter);
app.use('/api/project', projectRoutes);
app.use('/api/blog', BlogPostsRouter);
app.use('/api/newsletter', NewsletterRouter);

// Set the PORT
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
