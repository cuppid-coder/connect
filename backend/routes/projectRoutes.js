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
  addComment,
  editComment,
  deleteComment,
} = require("../controllers/projectController");
const { 
  authMiddleware, 
  validateProjectAccess 
} = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Project CRUD routes
router.get("/", getProjects);
router.get("/:id", validateProjectAccess, getProjectById);
router.post("/", createProject);
router.put("/:id", validateProjectAccess, updateProject);
router.delete("/:id", validateProjectAccess, deleteProject);

// Project member management
router.post("/:id/members", validateProjectAccess, addMember);
router.delete("/:id/members", validateProjectAccess, removeMember);

// Project analytics
router.get("/:id/analytics", validateProjectAccess, getProjectAnalytics);

// Project comments
router.post("/:id/comments", validateProjectAccess, addComment);
router.put("/:id/comments/:commentId", validateProjectAccess, editComment);
router.delete("/:id/comments/:commentId", validateProjectAccess, deleteComment);

module.exports = router;
