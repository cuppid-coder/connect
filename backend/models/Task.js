const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
    default: 0,
  },
  description: String,
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "completed", "blocked"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: Date,
    tags: [String],
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    timeTracking: {
      estimated: {
        type: Number,
        default: 0, // in hours
      },
      actual: {
        type: Number,
        default: 0, // in hours
      },
      timeLogs: [timeLogSchema],
    },
    dependencies: [
      {
        task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
        type: {
          type: String,
          enum: ["blocks", "blocked_by", "relates_to"],
        },
      },
    ],
    subtasks: [
      {
        title: String,
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      },
    ],
    completedAt: Date,
    visibility: {
      type: String,
      enum: ['public', 'private', 'project', 'team'],
      default: 'project'
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

// Add text indexes for search
taskSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  "subtasks.title": "text",
  "comments.content": "text",
});

// Indexes for efficient querying
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ title: "text", description: "text", tags: "text" });

// Update project metrics when task status changes
taskSchema.pre("save", async function (next) {
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== "completed") {
      this.completedAt = null;
    }

    // Update project metrics
    const Project = mongoose.model("Project");
    const project = await Project.findById(this.project);
    if (project) {
      await project.updateMetrics();
    }
  }
  next();
});

// Method to start time tracking
taskSchema.methods.startTimeTracking = async function (
  userId,
  description = ""
) {
  const activeLog = this.timeTracking.timeLogs.find(
    (log) => log.user.toString() === userId.toString() && !log.endTime
  );

  if (activeLog) {
    throw new Error("Time tracking already active for this user");
  }

  this.timeTracking.timeLogs.push({
    user: userId,
    startTime: new Date(),
    description,
  });

  await this.save();
  return this.timeTracking.timeLogs[this.timeTracking.timeLogs.length - 1];
};

// Method to stop time tracking
taskSchema.methods.stopTimeTracking = async function (userId) {
  const activeLog = this.timeTracking.timeLogs.find(
    (log) => log.user.toString() === userId.toString() && !log.endTime
  );

  if (!activeLog) {
    throw new Error("No active time tracking found for this user");
  }

  activeLog.endTime = new Date();
  activeLog.duration = Math.round(
    (activeLog.endTime - activeLog.startTime) / 1000 / 60
  );

  // Update total actual time
  this.timeTracking.actual = this.timeTracking.timeLogs.reduce(
    (total, log) => total + (log.duration || 0) / 60,
    0
  );

  await this.save();
  return activeLog;
};

// Method to calculate progress based on subtasks
taskSchema.methods.calculateProgress = function () {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.status === "completed" ? 100 : 0;
  }

  const completedSubtasks = this.subtasks.filter(
    (subtask) => subtask.completed
  ).length;
  return Math.round((completedSubtasks / this.subtasks.length) * 100);
};

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
