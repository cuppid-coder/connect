const jwt = require("jsonwebtoken");
const User = require("../models/User");

class SocketManager {
  constructor(io) {
    this.io = io;
    this.chatRooms = new Map();
    this.userSockets = new Map();
    this.notificationRooms = new Map();
  }

  initialize() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });

    this.io.on("connection", async (socket) => {
      if (socket.user) {
        // Update user's socket ID and status
        await User.findByIdAndUpdate(socket.user._id, {
          socketId: socket.id,
          status: "online",
        });

        this.userSockets.set(socket.user._id.toString(), socket.id);
        this.broadcastUserStatus(socket.user._id, "online");

        // Join user's personal notification room
        socket.join(`notifications:${socket.user._id}`);
      }

      socket.on("join_chat", (chatId) => {
        socket.join(chatId);
        const users = this.chatRooms.get(chatId) || new Set();
        users.add(socket.user?._id);
        this.chatRooms.set(chatId, users);
      });

      socket.on("leave_chat", (chatId) => {
        socket.leave(chatId);
        const users = this.chatRooms.get(chatId);
        if (users) {
          users.delete(socket.user?._id);
          if (users.size === 0) {
            this.chatRooms.delete(chatId);
          } else {
            this.chatRooms.set(chatId, users);
          }
        }
      });

      socket.on("typing", ({ chatId }) => {
        socket.to(chatId).emit("user_typing", {
          userId: socket.user?._id,
          chatId,
        });
      });

      socket.on("stop_typing", ({ chatId }) => {
        socket.to(chatId).emit("user_stop_typing", {
          userId: socket.user?._id,
          chatId,
        });
      });

      socket.on("join_team", (teamId) => {
        socket.join(`team:${teamId}`);
      });

      socket.on("leave_team", (teamId) => {
        socket.leave(`team:${teamId}`);
      });

      socket.on("disconnect", async () => {
        if (socket.user?._id) {
          await User.findByIdAndUpdate(socket.user._id, {
            socketId: null,
            status: "offline",
            lastSeen: new Date(),
          });

          this.userSockets.delete(socket.user._id.toString());
          this.broadcastUserStatus(socket.user._id, "offline");

          // Clean up user from chat rooms
          this.chatRooms.forEach((users, chatId) => {
            if (users.has(socket.user._id)) {
              users.delete(socket.user._id);
              if (users.size === 0) {
                this.chatRooms.delete(chatId);
              }
            }
          });

          // Leave notification room
          socket.leave(`notifications:${socket.user._id}`);
        }
      });
    });
  }

  broadcastUserStatus(userId, status) {
    this.io.emit("user_status_changed", { userId, status });
  }

  notifyNewMessage(chatId, message) {
    this.io.to(chatId).emit("new_message", message);
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    this.io.to(`notifications:${userId}`).emit(event, data);
  }

  // Broadcast notification to team
  notifyTeam(teamId, event, data) {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  // Broadcast system-wide notification
  broadcastNotification(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketManager;
