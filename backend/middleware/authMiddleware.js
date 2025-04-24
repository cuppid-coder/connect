const admin = require('firebase-admin');
const firebaseConfig = require('../config/firebase.config');
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Team = require("../models/Team");
const Project = require("../models/Project");
const Task = require("../models/Task");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
});

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to validate team membership
const validateTeamMembership = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const user = req.user;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (
      !team.members.includes(user._id) &&
      team.owner.toString() !== user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.team = team;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to validate chat access
const validateChatAccess = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const user = req.user;

    if (chatId.startsWith("private-")) {
      const userIds = chatId.split("-").slice(1);
      if (!userIds.includes(user._id.toString())) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (chatId.startsWith("team-")) {
      const teamId = chatId.split("-")[1];
      const team = await Team.findById(teamId);
      if (
        !team ||
        (!team.members.includes(user._id) &&
          team.owner.toString() !== user._id.toString())
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check project access
const validateProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

    const project = await Project.findById(projectId)
      .populate('team');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check visibility settings
    if (project.visibility === 'private') {
      // Only project members can access
      if (!project.members.some(member => member.user.toString() === userId.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (project.visibility === 'team_only') {
      // Check if user is in the team
      if (!project.team.members.some(member => member.user.toString() === userId.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // Public projects are accessible to all

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check task access
const validateTaskAccess = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;

    const task = await Task.findById(taskId)
      .populate({
        path: 'project',
        populate: { path: 'team' }
      });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check task visibility
    if (task.visibility === 'private') {
      // Only assignees and creator can access
      if (!task.assignees.includes(userId) && task.creator.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (task.visibility === 'project') {
      // Check if user is project member
      if (!task.project.members.some(member => member.user.toString() === userId.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (task.visibility === 'team') {
      // Check if user is team member
      if (!task.project.team.members.some(member => member.user.toString() === userId.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // Public tasks are accessible to all

    req.task = task;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  authMiddleware,
  validateTeamMembership,
  validateChatAccess,
  validateProjectAccess,
  validateTaskAccess
};
