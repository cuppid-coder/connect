const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const SocketManager = require("../utils/socketManager");

// Routes
const userRoutes = require("../routes/userRoutes");
const messageRoutes = require("../routes/messageRoutes");
const teamRoutes = require("../routes/teamRoutes");
const taskRoutes = require("../routes/taskRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const searchRoutes = require("../routes/searchRoutes");
const analyticsRoutes = require("../routes/analyticsRoutes");

// Middleware
const { authenticate } = require("../middleware/authMiddleware");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make app instance available globally for notifications
global.app = app;

// Initialize socket manager
const socketManager = new SocketManager(io);
socketManager.initialize();
app.set("socketManager", socketManager);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with enhanced options
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/connect", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true, // Build indexes
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
    socketTimeoutMS: 45000, // Close sockets after 45s
    family: 4, // Use IPv4, skip trying IPv6
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/messages", authenticate, (req, res, next) =>
  messageRoutes(req, res, next)
);
app.use("/api/teams", authenticate, (req, res, next) =>
  teamRoutes(req, res, next)
);
app.use("/api/tasks", authenticate, (req, res, next) =>
  taskRoutes(req, res, next)
);
app.use("/api/notifications", authenticate, (req, res, next) =>
  notificationRoutes(req, res, next)
);
app.use("/api/search", authenticate, (req, res, next) =>
  searchRoutes(req, res, next)
);
app.use("/api/analytics", authenticate, (req, res, next) =>
  analyticsRoutes(req, res, next)
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle process termination
process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  server.close(() => {
    console.log("Server closed.");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});
