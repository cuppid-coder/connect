const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed", "cancelled"],
      default: "planning",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["developer", "designer", "analyst", "tester", "other"],
          default: "other",
        },
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    tags: [String],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    budget: {
      allocated: {
        type: Number,
        default: 0,
      },
      spent: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
    metrics: {
      taskCompletion: {
        total: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
      },
      timeTracking: {
        estimated: { type: Number, default: 0 }, // in hours
        actual: { type: Number, default: 0 }, // in hours
      },
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'private', 'team_only'],
      default: 'team_only'
    },
    accessControl: {
      canViewTasks: {
        type: String,
        enum: ['public', 'team', 'members_only'],
        default: 'members_only'
      },
      canJoinProject: {
        type: String,
        enum: ['anyone', 'team_members', 'invite_only'],
        default: 'team_members'
      }
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        content: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
        edited: {
          type: Boolean,
          default: false
        },
        editedAt: Date,
        mentions: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }]
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Add text indexes for search
projectSchema.index({
  name: "text",
  description: "text",
  tags: "text",
  status: "text",
});

// Method to calculate project progress based on tasks
projectSchema.methods.calculateProgress = async function () {
  if (this.tasks.length === 0) return 0;

  await this.populate("tasks");
  const completedTasks = this.tasks.filter(
    (task) => task.status === "completed"
  ).length;
  this.progress = Math.round((completedTasks / this.tasks.length) * 100);
  await this.save();

  return this.progress;
};

// Update metrics when tasks change
projectSchema.methods.updateMetrics = async function () {
  await this.populate("tasks");

  this.metrics.taskCompletion.total = this.tasks.length;
  this.metrics.taskCompletion.completed = this.tasks.filter(
    (task) => task.status === "completed"
  ).length;

  this.metrics.timeTracking.actual = this.tasks.reduce(
    (sum, task) => sum + (task.timeTracking?.actual || 0),
    0
  );

  this.metrics.timeTracking.estimated = this.tasks.reduce(
    (sum, task) => sum + (task.timeTracking?.estimated || 0),
    0
  );

  await this.save();
};

// Middleware to update progress based on tasks
projectSchema.methods.updateProgress = async function () {
  const tasks = await mongoose.model("Task").find({ _id: { $in: this.tasks } });
  if (tasks.length === 0) return;

  const completed = tasks.filter((task) => task.status === "completed").length;
  this.progress = Math.round((completed / tasks.length) * 100);
  await this.save();
};

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
