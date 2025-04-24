const express = require("express");
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  startTimeTracking,
  stopTimeTracking,
  addComment,
  updateSubtask,
} = require("../controllers/taskController");
const { 
  authMiddleware,
  validateTaskAccess 
} = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Task CRUD routes
router.get("/", getTasks);
router.get("/:id", validateTaskAccess, getTaskById);
router.post("/", createTask);
router.put("/:id", validateTaskAccess, updateTask);
router.delete("/:id", validateTaskAccess, deleteTask);

// Time tracking routes
router.post("/:id/time/start", validateTaskAccess, startTimeTracking);
router.post("/:id/time/stop", validateTaskAccess, stopTimeTracking);

// Comments and subtasks
router.post("/:id/comments", validateTaskAccess, addComment);
router.put("/:id/subtasks", validateTaskAccess, updateSubtask);

module.exports = router;
