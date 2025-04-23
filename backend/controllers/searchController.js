const Task = require("../models/Task");
const Project = require("../models/Project");
const Team = require("../models/Team");
const Message = require("../models/Message");

exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const [tasks, projects, teams, messages] = await Promise.all([
      Task.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .populate("assignees", "name email")
        .limit(5),
      Project.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .populate("manager", "name email")
        .limit(5),
      Team.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .populate("leader members", "name email")
        .limit(5),
      Message.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .populate("sender", "name email")
        .limit(5),
    ]);

    return res.json({
      data: {
        tasks,
        projects,
        teams,
        messages,
      },
    });
  } catch (error) {
    console.error("Global search error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.advancedSearch = async (req, res) => {
  try {
    const { query, type, status, priority, assignee, tags, dateRange } =
      req.query;

    let searchQuery = {};
    let Model;

    // Build base text search if query exists
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Add date range if provided
    if (dateRange) {
      const { start, end } = JSON.parse(dateRange);
      searchQuery.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    // Add tags if provided
    if (tags) {
      searchQuery.tags = { $all: tags.split(",") };
    }

    // Type-specific search parameters
    switch (type) {
      case "task":
        Model = Task;
        if (status) searchQuery.status = status;
        if (priority) searchQuery.priority = priority;
        if (assignee) searchQuery.assignees = assignee;
        break;
      case "project":
        Model = Project;
        if (status) searchQuery.status = status;
        break;
      case "team":
        Model = Team;
        break;
      default:
        return res.status(400).json({ message: "Invalid search type" });
    }

    const results = await Model.find(
      searchQuery,
      query ? { score: { $meta: "textScore" } } : {}
    )
      .sort(query ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .populate("assignees manager leader members", "name email")
      .limit(20);

    return res.json({
      data: results,
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTags = async (req, res) => {
  try {
    const { type } = req.params;
    let Model;

    switch (type) {
      case "task":
        Model = Task;
        break;
      case "project":
        Model = Project;
        break;
      case "team":
        Model = Team;
        break;
      default:
        return res.status(400).json({ message: "Invalid type" });
    }

    const tags = await Model.distinct("tags");
    return res.json({ tags });
  } catch (error) {
    console.error("Get tags error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const messages = await Message.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .populate("sender", "name email avatar")
      .populate("receiver", "name email avatar")
      .limit(20);

    return res.json({ data: messages });
  } catch (error) {
    console.error("Message search error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
