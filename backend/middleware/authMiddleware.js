const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Team = require("../models/Team");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Server error" });
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

module.exports = {
  authenticate,
  validateTeamMembership,
  validateChatAccess,
};
