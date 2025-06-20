const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const dotenv = require("dotenv")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const http = require("http")
const socketManager = require("./Socket.io/Socket")
const BlogPost = require("./Models/BlogsModel")

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
const ClientchatRouter = require("./Routers/ClientChats")
const BankRouter = require("./Routers/BankManagment")
const InvoiceRouter = require("./Routers/Invoice")
const ClientSupportouter = require("./Routers/ClientSupport")
const ClientNotificationRouter = require("./Routers/ClientNotifications")
const TeamAuthRouter = require("./Routers/TeamPortal/Auth")
const TeamadditionRouter = require("./Routers/TeamPortal/Team")
const TeamtaskRouter = require("./Routers/TeamPortal/TaskAssign")
const TeamtaskinfoRouter = require("./Routers/TeamPortal/TaskInfo")
const TeamtaskprojectsRouter = require("./Routers/TeamPortal/TaskProject")

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Initialize Socket.IO
const io = socketManager.init(server)

// Middleware
app.use(cors())

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "./Multer/Uploads")))

app.use(
  session({
    secret: process.env.SESSION_SECRET || "msofts", 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, 
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", 
      maxAge: 1000 * 60 * 60 * 24, 
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
  // console.log("New client connected")
  socket.on("disconnect", () => {
    // console.log("Client disconnected")
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
app.use("/api/messages", ClientchatRouter)
app.use("/api/bank",BankRouter)
app.use("/api/invoice",InvoiceRouter)
app.use("/api/client/support-ticket",ClientSupportouter)
app.use("/api/client/notification",ClientNotificationRouter)
app.use("/api/team/auth",TeamAuthRouter)
app.use("/api/team/create",TeamadditionRouter)
app.use("/api/team/task",TeamtaskRouter)
app.use("/api/team/task/info",TeamtaskinfoRouter)
app.use("/api/team/task/project",TeamtaskprojectsRouter)

// Set the PORT
const PORT = process.env.PORT || 5000

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

