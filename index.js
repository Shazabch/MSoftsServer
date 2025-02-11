const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const dotenv = require("dotenv")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const http = require("http")
const socketManager = require("./Socket.io/Socket")

// Import routes
const authRoutes = require("./Routers/Auth")
const subAdminRoutes = require("./Routers/SubAdmin")
const RolesRoutes = require("./Routers/Roles")
const testimonialRoutes = require("./Routers/Feedback")
const contactRouter = require("./Routers/ContactController")
const InquiryRouter = require("./Routers/CostInquiry")
const TeamMemberRouter = require("./Routers/TeamMember")
const BlogPostsRouter = require("./Routers/BlogsPosts")
const projectRoutes = require("./Routers/Projects")
const NewsletterRouter = require("./Routers/Newsletter")
const ClientsRouter = require("./Routers/ClientsAdmin")
const ClientsLoginRouter = require("./Routers/ClientLogin")
const ClientsProjectsRouter = require("./Routers/ClientProjects")
const ProgressNotificationRouter = require("./Routers/Notifications")
const ChatRouter = require("./Routers/Chat")
const ResetRouter = require("./Routers/ResetPassword")
const LinkedInRouter = require("./Routers/LinkedInAuth")
const ProfileRouter = require("./Routers/ClientProfile")

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Initialize Socket.IO
const io = socketManager.init(server)

// Middleware
app.use(cors())

app.use(express.json())

app.use("/uploads", express.static(path.join(__dirname, "./Multer/Uploads")))

app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecret", // Use a strong secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // MongoDB connection string
      collectionName: "sessions", // Optional: custom session collection name
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("New client connected")
  socket.on("disconnect", () => {
    console.log("Client disconnected")
  })
})

// Define routes
app.use("/api/auth", authRoutes)
app.use("/api/subadmins", subAdminRoutes)
app.use("/api/roles", RolesRoutes)
app.use("/api/testimonials", testimonialRoutes)
app.use("/contact", contactRouter)
app.use("/api/inquiry", InquiryRouter)
app.use("/api/team", TeamMemberRouter)
app.use("/api/project", projectRoutes)
app.use("/api/blog", BlogPostsRouter)
app.use("/api/newsletter", NewsletterRouter)
app.use("/api/clients", ClientsRouter)
app.use("/api/user", ClientsLoginRouter)
app.use("/api/client/projects", ClientsProjectsRouter)
app.use("/api/notifications", ProgressNotificationRouter)
app.use("/api/chat", ChatRouter)
app.use("/api/reset", ResetRouter)
app.use("/api/linkedin", LinkedInRouter)
app.use("/api/profile", ProfileRouter)

// Set the PORT
const PORT = process.env.PORT || 5000

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

