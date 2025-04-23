const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: function () {
        return !this.attachments || this.attachments.length === 0;
      },
      trim: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    chatType: {
      type: String,
      enum: ["private", "group", "team"],
      required: true,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "file"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        name: String,
        size: Number,
        mimeType: String,
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

// Add text indexes for search
messageSchema.index({
  content: "text",
  "attachments.name": "text",
});

// Compound indexes for efficient queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

// Virtual field for read status
messageSchema.virtual("isRead").get(function () {
  return this.readBy && this.readBy.length > 0;
});

// Instance method to check if a user has read the message
messageSchema.methods.isReadBy = function (userId) {
  return this.readBy.some((id) => id.toString() === userId.toString());
};

// Static method to get unread count for a user in a chat
messageSchema.statics.getUnreadCount = async function (chatId, userId) {
  return this.countDocuments({
    chatId,
    readBy: { $ne: userId },
  });
};

// Pre-save middleware to handle message validation and cleanup
messageSchema.pre("save", function (next) {
  // Clear receiver for group/team chats
  if (this.chatType !== "private") {
    this.receiver = undefined;
  }

  // Ensure content or attachments exist
  if (!this.content && (!this.attachments || this.attachments.length === 0)) {
    next(new Error("Message must have either content or attachments"));
  }

  next();
});

// Configure JSON serialization
messageSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Message", messageSchema);
