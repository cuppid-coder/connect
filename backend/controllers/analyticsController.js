const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

// Get workspace-wide analytics
exports.getWorkspaceAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Project metrics
    const projects = await Project.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const projectMetrics = {
      total: await Project.countDocuments(),
      active: await Project.countDocuments({ status: "active" }),
      completed: await Project.countDocuments({ status: "completed" }),
      thisMonth: projects.length,
      byStatus: await Project.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    };

    // Task metrics
    const taskMetrics = {
      total: await Task.countDocuments(),
      completed: await Task.countDocuments({ status: "completed" }),
      inProgress: await Task.countDocuments({ status: "in_progress" }),
      overdue: await Task.countDocuments({
        dueDate: { $lt: now },
        status: { $ne: "completed" },
      }),
      byPriority: await Task.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      byStatus: await Task.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    };

    // Time tracking metrics
    const timeTrackingMetrics = await Task.aggregate([
      {
        $group: {
          _id: null,
          totalEstimated: { $sum: "$timeTracking.estimated" },
          totalActual: { $sum: "$timeTracking.actual" },
        },
      },
    ]);

    // User activity metrics
    const userMetrics = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ status: "online" }),
      taskDistribution: await Task.aggregate([
        { $unwind: "$assignees" },
        {
          $group: {
            _id: "$assignees",
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            name: "$user.name",
            totalTasks: 1,
            completedTasks: 1,
            completionRate: {
              $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100],
            },
          },
        },
      ]),
    };

    res.json({
      projects: projectMetrics,
      tasks: taskMetrics,
      timeTracking: timeTrackingMetrics[0] || {
        totalEstimated: 0,
        totalActual: 0,
      },
      users: userMetrics,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get project-specific analytics
exports.getProjectAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const projectId = req.params.projectId;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const project = await Project.findById(projectId).populate({
      path: "tasks",
      match: dateFilter,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Calculate task metrics
    const taskAnalytics = {
      total: project.tasks.length,
      byStatus: project.tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}),
      byPriority: project.tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {}),
    };

    // Calculate time tracking metrics
    const timeTracking = project.tasks.reduce(
      (acc, task) => {
        acc.estimated += task.timeTracking.estimated || 0;
        acc.actual += task.timeTracking.actual || 0;
        return acc;
      },
      { estimated: 0, actual: 0 }
    );

    // Calculate member contributions
    const memberContributions = await Task.aggregate([
      { $match: { project: project._id } },
      { $unwind: "$assignees" },
      {
        $group: {
          _id: "$assignees",
          tasksAssigned: { $sum: 1 },
          tasksCompleted: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          timeSpent: { $sum: "$timeTracking.actual" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          tasksAssigned: 1,
          tasksCompleted: 1,
          timeSpent: 1,
          completionRate: {
            $multiply: [
              { $divide: ["$tasksCompleted", "$tasksAssigned"] },
              100,
            ],
          },
        },
      },
    ]);

    // Calculate timeline metrics
    const timeline = {
      duration: Math.ceil(
        (project.endDate - project.startDate) / (1000 * 60 * 60 * 24)
      ),
      daysRemaining: Math.ceil(
        (project.endDate - new Date()) / (1000 * 60 * 60 * 24)
      ),
      progress: project.progress,
      isOnSchedule: timeTracking.actual <= timeTracking.estimated,
    };

    res.json({
      projectId,
      name: project.name,
      tasks: taskAnalytics,
      timeTracking,
      memberContributions,
      timeline,
      budget: project.budget,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user performance analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Task performance
    const taskMetrics = await Task.aggregate([
      { $match: { assignees: userId, ...dateFilter } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          timeEstimated: { $sum: "$timeTracking.estimated" },
          timeSpent: { $sum: "$timeTracking.actual" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          completed: 1,
          completion_rate: {
            $multiply: [{ $divide: ["$completed", "$total"] }, 100],
          },
          timeEstimated: 1,
          timeSpent: 1,
          efficiency: {
            $multiply: [
              {
                $divide: [
                  "$timeEstimated",
                  { $cond: [{ $eq: ["$timeSpent", 0] }, 1, "$timeSpent"] },
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    // Project involvement
    const projectMetrics = await Project.aggregate([
      {
        $match: {
          "members.user": userId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completedProjects: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]);

    // Activity timeline
    const activityTimeline = await Task.aggregate([
      { $match: { assignees: userId, ...dateFilter } },
      { $sort: { updatedAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          title: 1,
          status: 1,
          updatedAt: 1,
          type: "task",
        },
      },
    ]);

    res.json({
      userId,
      taskMetrics: taskMetrics[0] || {
        total: 0,
        completed: 0,
        completion_rate: 0,
        timeEstimated: 0,
        timeSpent: 0,
        efficiency: 0,
      },
      projectMetrics: projectMetrics[0] || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
      },
      activityTimeline,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team performance analytics
exports.getTeamAnalytics = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Team project metrics
    const projectMetrics = await Project.aggregate([
      { $match: { team: teamId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completedProjects: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]);

    // Team task metrics
    const taskMetrics = await Task.aggregate([
      { $match: { team: teamId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          timeEstimated: { $sum: "$timeTracking.estimated" },
          timeSpent: { $sum: "$timeTracking.actual" },
        },
      },
      {
        $project: {
          _id: 0,
          totalTasks: 1,
          completedTasks: 1,
          completionRate: {
            $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100],
          },
          timeEstimated: 1,
          timeSpent: 1,
          efficiency: {
            $multiply: [
              {
                $divide: [
                  "$timeEstimated",
                  { $cond: [{ $eq: ["$timeSpent", 0] }, 1, "$timeSpent"] },
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    // Member performance metrics
    const memberMetrics = await Task.aggregate([
      { $match: { team: teamId, ...dateFilter } },
      { $unwind: "$assignees" },
      {
        $group: {
          _id: "$assignees",
          tasksAssigned: { $sum: 1 },
          tasksCompleted: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          timeSpent: { $sum: "$timeTracking.actual" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          tasksAssigned: 1,
          tasksCompleted: 1,
          timeSpent: 1,
          completionRate: {
            $multiply: [
              { $divide: ["$tasksCompleted", "$tasksAssigned"] },
              100,
            ],
          },
        },
      },
    ]);

    res.json({
      teamId,
      projectMetrics: projectMetrics[0] || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
      },
      taskMetrics: taskMetrics[0] || {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        timeEstimated: 0,
        timeSpent: 0,
        efficiency: 0,
      },
      memberMetrics,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
