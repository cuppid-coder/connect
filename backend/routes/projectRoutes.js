const express = require("express");
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectAnalytics,
} = require("../controllers/projectController");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

// Project CRUD routes
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Project member management
router.post("/:id/members", addMember);
router.delete("/:id/members", removeMember);

// Project analytics
router.get("/:id/analytics", getProjectAnalytics);

module.exports = router;
