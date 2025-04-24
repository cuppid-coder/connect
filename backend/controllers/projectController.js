const Project = require("../models/Project");
const Task = require("../models/Task");
const Team = require("../models/Team");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// Get all projects (with filtering and pagination)
exports.getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      team,
      search,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    const userId = req.user._id;

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (team) query.team = team;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };
    if (search) {
      query.$text = { $search: search };
    }

    // Handle visibility
    query.$or = [
      { visibility: 'public' },
      { 'members.user': userId },
      // Show team_only projects where user is in the team
      {
        $and: [
          { visibility: 'team_only' },
          { team: { $in: (await User.findById(userId)).teams } }
        ]
      }
    ];

    const projects = await Project.find(query)
      .populate("team", "name")
      .populate("manager", "name avatar")
      .populate("members.user", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("team", "name members")
      .populate("manager", "name avatar email")
      .populate("members.user", "name avatar email")
      .populate({
        path: "tasks",
        populate: {
          path: "assignees",
          select: "name avatar",
        },
      });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      teamId,
      members,
      tags,
      priority,
      budget,
      visibility = 'team_only',
      accessControl = {
        canViewTasks: 'members_only',
        canJoinProject: 'team_members'
      }
    } = req.body;

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const project = new Project({
      name,
      description,
      startDate,
      endDate,
      team: teamId,
      manager: req.user._id,
      members: members || [],
      tags,
      priority,
      budget,
      visibility,
      accessControl
    });

    await project.save();

    // Only notify team members if project is not private
    if (visibility !== 'private') {
      const notification = {
        type: "PROJECT_UPDATE",
        title: "New Project Created",
        content: `A new project has been created: ${name}`,
        reference: {
          model: "Project",
          id: project._id,
        },
      };

      // Notify team members
      team.members.forEach(async (memberId) => {
        if (memberId.toString() !== req.user._id.toString()) {
          await createNotification({
            ...notification,
            recipient: memberId,
          });
        }
      });
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const updates = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has permission
    if (project.manager.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update project" });
    }

    // Track significant changes for notifications
    const significantChanges = [];
    if (updates.status && updates.status !== project.status) {
      significantChanges.push(`Status changed to ${updates.status}`);
    }
    if (updates.endDate && updates.endDate !== project.endDate) {
      significantChanges.push("Timeline updated");
    }
    if (updates.visibility && updates.visibility !== project.visibility) {
      significantChanges.push(`Visibility changed to ${updates.visibility}`);
    }

    Object.keys(updates).forEach((update) => {
      project[update] = updates[update];
    });

    await project.save();

    // Send notifications for significant changes
    if (significantChanges.length > 0 && project.visibility !== 'private') {
      const notification = {
        type: "PROJECT_UPDATE",
        title: "Project Updated",
        content: `Project ${project.name}: ${significantChanges.join(", ")}`,
        reference: {
          model: "Project",
          id: project._id,
        },
      };

      project.members.forEach(async (member) => {
        if (member.user.toString() !== req.user._id.toString()) {
          await createNotification({
            ...notification,
            recipient: member.user,
          });
        }
      });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has permission
    if (project.manager.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete project" });
    }

    // Delete associated tasks
    await Task.deleteMany({ _id: { $in: project.tasks } });

    await project.remove();

    // Notify team members
    const notification = {
      type: "PROJECT_UPDATE",
      title: "Project Deleted",
      content: `Project ${project.name} has been deleted`,
      reference: {
        model: "Project",
        id: project._id,
      },
    };

    project.members.forEach(async (member) => {
      if (member.user.toString() !== req.user._id.toString()) {
        await createNotification({
          ...notification,
          recipient: member.user,
        });
      }
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get project analytics
exports.getProjectAnalytics = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("tasks")
      .populate("members.user", "name");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await project.updateMetrics();

    const analytics = {
      overview: {
        progress: project.progress,
        totalTasks: project.metrics.taskCompletion.total,
        completedTasks: project.metrics.taskCompletion.completed,
        timeProgress: {
          estimated: project.metrics.timeTracking.estimated,
          actual: project.metrics.timeTracking.actual,
        },
        budget: {
          allocated: project.budget.allocated,
          spent: project.budget.spent,
          remaining: project.budget.allocated - project.budget.spent,
        },
      },
      tasksByStatus: project.tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}),
      tasksByMember: project.tasks.reduce((acc, task) => {
        task.assignees.forEach((assignee) => {
          acc[assignee.name] = (acc[assignee.name] || 0) + 1;
        });
        return acc;
      }, {}),
      timeline: {
        start: project.startDate,
        end: project.endDate,
        duration: Math.ceil(
          (project.endDate - project.startDate) / (1000 * 60 * 60 * 24)
        ),
        daysRemaining: Math.ceil(
          (project.endDate - new Date()) / (1000 * 60 * 60 * 24)
        ),
      },
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add member to project
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.members.some((member) => member.user.toString() === userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    project.members.push({ user: userId, role });
    await project.save();

    // Notify new member
    await createNotification({
      recipient: userId,
      type: "PROJECT_UPDATE",
      title: "Added to Project",
      content: `You have been added to project: ${project.name}`,
      reference: {
        model: "Project",
        id: project._id,
      },
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove member from project
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.members = project.members.filter(
      (member) => member.user.toString() !== userId
    );
    await project.save();

    // Notify removed member
    await createNotification({
      recipient: userId,
      type: "PROJECT_UPDATE",
      title: "Removed from Project",
      content: `You have been removed from project: ${project.name}`,
      reference: {
        model: "Project",
        id: project._id,
      },
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment to project
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const project = await Project.findById(req.params.id)
      .populate("members.user", "name")
      .populate("manager", "name");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access to comment
    const canComment = project.members.some(
      member => member.user._id.toString() === req.user._id.toString()
    ) || project.manager._id.toString() === req.user._id.toString();

    if (!canComment) {
      return res.status(403).json({ message: "Not authorized to comment on this project" });
    }

    // Extract mentions from content (format: @userId)
    const mentionRegex = /@([a-f\d]{24})/gi;
    const mentions = [...content.matchAll(mentionRegex)].map(match => match[1]);

    const comment = {
      user: req.user._id,
      content,
      mentions: mentions
    };

    project.comments.push(comment);
    await project.save();

    // Get socket manager instance
    const socketManager = global.app.get("socketManager");

    // Notify project members about the new comment
    const notifyUsers = project.members.map(member => member.user._id);
    if (!notifyUsers.includes(project.manager._id)) {
      notifyUsers.push(project.manager._id);
    }

    const commentData = {
      ...comment,
      projectId: project._id,
      projectName: project.name,
      userName: req.user.name
    };

    // Send real-time notification to project members
    socketManager.notifyProjectMembers(project._id, "new_project_comment", commentData);

    // Send notifications for mentions
    if (mentions.length > 0) {
      mentions.forEach(async (userId) => {
        await createNotification({
          recipient: userId,
          type: "MENTION",
          title: "Mentioned in Project Comment",
          content: `You were mentioned in a comment on project "${project.name}"`,
          reference: {
            model: "Project",
            id: project._id
          }
        });
      });
    }

    // Notify other project members
    notifyUsers.forEach(async (userId) => {
      if (userId.toString() !== req.user._id.toString() && !mentions.includes(userId.toString())) {
        await createNotification({
          recipient: userId,
          type: "COMMENT",
          title: "New Comment on Project",
          content: `New comment on project "${project.name}"`,
          reference: {
            model: "Project",
            id: project._id
          }
        });
      }
    });

    res.json(project.comments[project.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit project comment
exports.editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const project = await Project.findOne({ "comments._id": commentId });

    if (!project) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const comment = project.comments.id(commentId);

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.content = content;
    comment.edited = true;
    comment.editedAt = new Date();

    await project.save();

    // Get socket manager instance
    const socketManager = global.app.get("socketManager");

    // Notify about comment edit
    socketManager.notifyProjectMembers(project._id, "project_comment_edited", {
      commentId,
      content,
      projectId: project._id
    });

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete project comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const project = await Project.findOne({ "comments._id": commentId });

    if (!project) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const comment = project.comments.id(commentId);

    if (comment.user.toString() !== req.user._id.toString() && 
        project.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    comment.remove();
    await project.save();

    // Get socket manager instance
    const socketManager = global.app.get("socketManager");

    // Notify about comment deletion
    socketManager.notifyProjectMembers(project._id, "project_comment_deleted", {
      commentId,
      projectId: project._id
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
