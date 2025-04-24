const jwt = require("jsonwebtoken");
const User = require("../models/User");

class SocketManager {
  constructor(io) {
    this.io = io;
    this.chatRooms = new Map();
    this.userSockets = new Map();
    this.notificationRooms = new Map();
    this.onlineUsers = new Map();
    this.projectRooms = new Map();
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
        this.onlineUsers.set(socket.user._id.toString(), {
          userId: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar,
          status: "online"
        });
        this.broadcastUserStatus(socket.user._id, "online");

        // Join user's personal notification room
        socket.join(`notifications:${socket.user._id}`);
        
        // Join user's contact updates room
        socket.join(`contacts:${socket.user._id}`);

        // Handle friend request
        socket.on("send_friend_request", async (targetUserId) => {
          const socketId = this.userSockets.get(targetUserId);
          if (socketId) {
            this.io.to(socketId).emit("friend_request_received", {
              from: {
                _id: socket.user._id,
                name: socket.user.name,
                avatar: socket.user.avatar
              }
            });
          }
        });

        // Handle direct message request
        socket.on("request_direct_message", async (targetUserId) => {
          const socketId = this.userSockets.get(targetUserId);
          if (socketId) {
            this.io.to(socketId).emit("direct_message_request", {
              from: {
                _id: socket.user._id,
                name: socket.user.name,
                avatar: socket.user.avatar
              }
            });
          }
        });

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

        // Handle project room join
        socket.on("join_project", (projectId) => {
          socket.join(`project:${projectId}`);
          const users = this.projectRooms.get(projectId) || new Set();
          users.add(socket.user._id);
          this.projectRooms.set(projectId, users);
        });

        // Handle project room leave
        socket.on("leave_project", (projectId) => {
          socket.leave(`project:${projectId}`);
          const users = this.projectRooms.get(projectId);
          if (users) {
            users.delete(socket.user._id);
            if (users.size === 0) {
              this.projectRooms.delete(projectId);
            }
          }
        });

        // Handle comment typing indicator
        socket.on("typing_comment", ({ projectId }) => {
          socket.to(`project:${projectId}`).emit("user_typing_comment", {
            userId: socket.user._id,
            userName: socket.user.name,
            projectId
          });
        });

        socket.on("stop_typing_comment", ({ projectId }) => {
          socket.to(`project:${projectId}`).emit("user_stop_typing_comment", {
            userId: socket.user._id,
            projectId
          });
        });

        socket.on("disconnect", async () => {
          if (socket.user?._id) {
            await User.findByIdAndUpdate(socket.user._id, {
              socketId: null,
              status: "offline",
              lastSeen: new Date(),
            });

            this.userSockets.delete(socket.user._id.toString());
            this.onlineUsers.delete(socket.user._id.toString());
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

            // Clean up user from project rooms
            this.projectRooms.forEach((users, projectId) => {
              if (users.has(socket.user._id)) {
                users.delete(socket.user._id);
                if (users.size === 0) {
                  this.projectRooms.delete(projectId);
                }
              }
            });

            // Leave notification room
            socket.leave(`notifications:${socket.user._id}`);
            
            // Leave contacts room
            socket.leave(`contacts:${socket.user._id}`);
          }
        });
      }
    });
  }

  // Helper methods for managing online users and requests
  async handleFriendRequest(fromUser, targetUserId, accept = false) {
    const socketId = this.userSockets.get(targetUserId);
    if (socketId) {
      this.io.to(socketId).emit("friend_request_update", {
        from: {
          _id: fromUser._id,
          name: fromUser.name,
          avatar: fromUser.avatar
        },
        status: accept ? "accepted" : "pending"
      });
    }
  }

  async handleMessageRequest(fromUser, targetUserId, accept = false) {
    const socketId = this.userSockets.get(targetUserId);
    if (socketId) {
      this.io.to(socketId).emit("message_request_update", {
        from: {
          _id: fromUser._id,
          name: fromUser.name,
          avatar: fromUser.avatar
        },
        status: accept ? "accepted" : "pending"
      });
    }
  }

  getUserStatus(userId) {
    return this.onlineUsers.has(userId.toString()) ? "online" : "offline";
  }

  notifyStatusChange(userId, status) {
    this.broadcastUserStatus(userId, status);
    if (status === "offline") {
      this.onlineUsers.delete(userId.toString());
    }
  }

  broadcastUserStatus(userId, status) {
    this.io.emit("user_status_changed", { userId, status });
  }

  notifyNewMessage(chatId, message) {
    this.io.to(chatId).emit("new_message", message);
  }

  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers.values());
  }

  // Broadcast notification to team
  notifyTeam(teamId, event, data) {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  // Broadcast system-wide notification
  broadcastNotification(event, data) {
    this.io.emit(event, data);
  }

  // Notify contact-related events
  notifyContactEvent(userId, event, data) {
    this.io.to(`contacts:${userId}`).emit(event, data);
  }

  // Notify project members
  notifyProjectMembers(projectId, event, data) {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  // Handle comment notifications
  notifyComment(targetRoom, event, data) {
    const { projectId, taskId } = data;
    const room = projectId ? `project:${projectId}` : `task:${taskId}`;
    this.io.to(room).emit(event, data);
  }

  // Handle user typing in comments
  handleCommentTyping(room, user, isTyping = true) {
    const event = isTyping ? 'comment_typing' : 'comment_typing_stopped';
    this.io.to(room).emit(event, {
      userId: user._id,
      userName: user.name,
      timestamp: new Date()
    });
  }

  // Join comment room
  joinCommentRoom(socket, roomId) {
    socket.join(roomId);
    this.io.to(roomId).emit('user_joined_comments', {
      userId: socket.user._id,
      userName: socket.user.name
    });
  }

  // Leave comment room
  leaveCommentRoom(socket, roomId) {
    socket.leave(roomId);
    this.io.to(roomId).emit('user_left_comments', {
      userId: socket.user._id,
      userName: socket.user.name
    });
  }
}

module.exports = SocketManager;
