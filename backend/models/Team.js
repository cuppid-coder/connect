const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["leader", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    avatar: {
      type: String,
      default: "",
    },
    tags: [String],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'request_to_join'],
      default: 'private'
    },
    joinRequests: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      requestedAt: {
        type: Date,
        default: Date.now
      }
    }],
    settings: {
      notifications: {
        newMembers: {
          type: Boolean,
          default: true,
        },
        projectUpdates: {
          type: Boolean,
          default: true,
        },
        taskAssignments: {
          type: Boolean,
          default: true,
        },
      },
      joinRequests: {
        requireApproval: {
          type: Boolean,
          default: true,
        },
      },
    },
    metrics: {
      totalProjects: {
        type: Number,
        default: 0,
      },
      completedProjects: {
        type: Number,
        default: 0,
      },
      totalTasks: {
        type: Number,
        default: 0,
      },
      completedTasks: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Add text indexes for search
teamSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

// Add compound indexes for common queries
teamSchema.index({ "members.user": 1 });
teamSchema.index({ leader: 1 });

// Instance method to update team metrics
teamSchema.methods.updateMetrics = async function () {
  const Project = mongoose.model("Project");
  const Task = mongoose.model("Task");

  const projectMetrics = await Project.aggregate([
    { $match: { team: this._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const taskMetrics = await Task.aggregate([
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
      },
    },
    { $unwind: "$project" },
    { $match: { "project.team": this._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
      },
    },
  ]);

  this.metrics = {
    totalProjects: projectMetrics[0]?.total || 0,
    completedProjects: projectMetrics[0]?.completed || 0,
    totalTasks: taskMetrics[0]?.total || 0,
    completedTasks: taskMetrics[0]?.completed || 0,
  };

  await this.save();
};

// Pre-save middleware to handle member updates
teamSchema.pre("save", function (next) {
  if (this.isModified("members")) {
    // Ensure leader is always a member
    const leaderMember = this.members.find(
      (member) => member.user.toString() === this.leader.toString()
    );

    if (!leaderMember) {
      this.members.push({
        user: this.leader,
        role: "leader",
        joinedAt: this.createdAt,
      });
    }
  }
  next();
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
