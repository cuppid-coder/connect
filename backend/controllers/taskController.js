const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// Get tasks with filtering and pagination
exports.getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      project,
      assignee,
      search,
      dueDate,
      tags,
    } = req.query;

    const query = {};
    const userId = req.user._id;

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project) query.project = project;
    if (assignee) query.assignees = assignee;
    if (tags) query.tags = { $in: tags.split(",") };
    if (dueDate) {
      const date = new Date(dueDate);
      query.dueDate = {
        $gte: date,
        $lt: new Date(date.setDate(date.getDate() + 1)),
      };
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Handle visibility
    query.$or = [
      { visibility: 'public' },
      { assignees: userId },
      { creator: userId },
      // Show project tasks if user is project member
      {
        $and: [
          { visibility: 'project' },
          {
            project: {
              $in: await Project.find({ 'members.user': userId }).distinct('_id')
            }
          }
        ]
      },
      // Show team tasks if user is team member
      {
        $and: [
          { visibility: 'team' },
          {
            project: {
              $in: await Project.find({ 
                team: { 
                  $in: (await User.findById(userId)).teams 
                } 
              }).distinct('_id')
            }
          }
        ]
      }
    ];

    const tasks = await Task.find(query)
      .populate("project", "name")
      .populate("assignees", "name avatar")
      .populate("creator", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalTasks: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name manager members")
      .populate("assignees", "name avatar email")
      .populate("creator", "name avatar")
      .populate("dependencies.task", "title status");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new task
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assignees,
      priority,
      dueDate,
      tags,
      estimated,
      dependencies,
      subtasks,
      visibility = 'project',
      isPrivate = false
    } = req.body;

    // Verify project exists and user has access
    const project = await Project.findById(projectId)
      .populate('team');
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has permission to create tasks in this project
    if (!project.members.some(member => member.user.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized to create tasks in this project" });
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      creator: req.user._id,
      assignees: assignees || [],
      priority,
      dueDate,
      tags,
      timeTracking: { estimated },
      dependencies: dependencies || [],
      subtasks: subtasks || [],
      visibility,
      isPrivate
    });

    await task.save();

    // Add task to project
    project.tasks.push(task._id);
    await project.save();

    // Only notify if task is not private
    if (!isPrivate) {
      // Notify assignees
      assignees?.forEach(async (userId) => {
        if (userId.toString() !== req.user._id.toString()) {
          await createNotification({
            recipient: userId,
            type: "TASK_ASSIGNED",
            title: "New Task Assignment",
            content: `You have been assigned to task: ${title}`,
            reference: {
              model: "Task",
              id: task._id,
            },
          });
        }
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const updates = req.body;
    const task = await Task.findById(req.params.id).populate(
      "project",
      "manager members"
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Track changes for notifications
    const changes = [];
    if (updates.status && updates.status !== task.status) {
      changes.push(`Status changed to ${updates.status}`);
    }
    if (updates.priority && updates.priority !== task.priority) {
      changes.push(`Priority changed to ${updates.priority}`);
    }

    // Update task fields
    Object.keys(updates).forEach((update) => {
      task[update] = updates[update];
    });

    await task.save();

    // Notify relevant users about changes
    if (changes.length > 0) {
      const notification = {
        type: "TASK_UPDATE",
        title: "Task Updated",
        content: `Task "${task.title}": ${changes.join(", ")}`,
        reference: {
          model: "Task",
          id: task._id,
        },
      };

      // Notify assignees and creator
      const notifyUsers = [...task.assignees];
      if (!notifyUsers.includes(task.creator)) {
        notifyUsers.push(task.creator);
      }

      notifyUsers.forEach(async (userId) => {
        if (userId.toString() !== req.user._id.toString()) {
          await createNotification({
            ...notification,
            recipient: userId,
          });
        }
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "project",
      "manager"
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check permissions
    if (
      task.creator.toString() !== req.user._id.toString() &&
      task.project.manager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to delete task" });
    }

    // Remove task from project
    await Project.findByIdAndUpdate(task.project._id, {
      $pull: { tasks: task._id },
    });

    await task.remove();

    // Notify assignees
    task.assignees.forEach(async (assigneeId) => {
      if (assigneeId.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: assigneeId,
          type: "TASK_UPDATE",
          title: "Task Deleted",
          content: `Task "${task.title}" has been deleted`,
          reference: {
            model: "Task",
            id: task._id,
          },
        });
      }
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start time tracking
exports.startTimeTracking = async (req, res) => {
  try {
    const { description } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const timeLog = await task.startTimeTracking(req.user._id, description);
    res.json(timeLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stop time tracking
exports.stopTimeTracking = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const timeLog = await task.stopTimeTracking(req.user._id);
    res.json(timeLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.comments.push({
      user: req.user._id,
      content,
    });

    await task.save();

    // Notify task assignees and creator about the new comment
    const notifyUsers = [...task.assignees];
    if (!notifyUsers.includes(task.creator)) {
      notifyUsers.push(task.creator);
    }

    notifyUsers.forEach(async (userId) => {
      if (userId.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: userId,
          type: "COMMENT",
          title: "New Comment on Task",
          content: `New comment on task "${task.title}"`,
          reference: {
            model: "Task",
            id: task._id,
          },
        });
      }
    });

    res.json(task.comments[task.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update subtask status
exports.updateSubtask = async (req, res) => {
  try {
    const { subtaskId, completed } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    subtask.completed = completed;
    subtask.completedAt = completed ? new Date() : null;

    await task.save();
    res.json(subtask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
