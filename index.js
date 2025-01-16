const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");
const multer = require("multer");
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
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
mongoose
.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));
app.use("/uploads", express.static(path.join(__dirname, "./Multer/Uploads")));
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
