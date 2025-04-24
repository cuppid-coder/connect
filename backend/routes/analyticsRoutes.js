const express = require("express");
const router = express.Router();
const {
  getUserAnalytics,
  getProjectAnalytics,
  getTeamAnalytics,
} = require("../controllers/analyticsController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/user/:userId", getUserAnalytics);
router.get("/project/:projectId", getProjectAnalytics);
router.get("/team/:teamId", getTeamAnalytics);

module.exports = router;
