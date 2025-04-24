const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",
        "TASK_COMPLETED",
        "TEAM_INVITE",
        "TEAM_JOIN",
        "MESSAGE",
        "MENTION",
        "COMMENT",
        "PROJECT_UPDATE",
        "PROJECT_COMMENT",
        "TASK_COMMENT",
        "DEADLINE_REMINDER",
        "CONTACT_REQUEST",
        "CONTACT_ACCEPTED"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    reference: {
      model: {
        type: String,
        enum: ["Task", "Team", "Message", "Project", "Comment"],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying unread notifications
notificationSchema.index({ recipient: 1, read: 1 });

// Index for cleaning up expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
