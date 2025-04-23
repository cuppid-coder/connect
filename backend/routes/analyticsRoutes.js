const express = require("express");
const router = express.Router();
const {
  getWorkspaceAnalytics,
  getProjectAnalytics,
  getUserAnalytics,
} = require("../controllers/analyticsController");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

// Workspace-wide analytics
router.get("/workspace", getWorkspaceAnalytics);

// Project-specific analytics
router.get("/projects/:projectId", getProjectAnalytics);

// User performance analytics - separate routes for all users and specific user
router.get("/users", getUserAnalytics);
router.get("/users/:userId", getUserAnalytics);

module.exports = router;
