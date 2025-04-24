const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    contacts: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
    contactRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending"
        },
        sentAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },
    socketId: {
      type: String,
      default: null,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      notifications: {
        desktop: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user lookup by email and firebaseUID
userSchema.index({ email: 1 });
userSchema.index({ firebaseUID: 1 });

// Index for finding online users
userSchema.index({ status: 1 });

// Compound index for team membership queries
userSchema.index({ teams: 1, status: 1 });

// Instance method to check if user is member of a team
userSchema.methods.isMemberOfTeam = function (teamId) {
  return this.teams.includes(teamId);
};

// Static method to find online users in a team
userSchema.statics.findOnlineTeamMembers = async function (teamId) {
  return this.find({
    teams: teamId,
    status: "online",
  });
};

module.exports = mongoose.model("User", userSchema);
