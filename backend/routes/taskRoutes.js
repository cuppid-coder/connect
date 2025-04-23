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
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

// Task CRUD routes
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

// Time tracking routes
router.post("/:id/time/start", startTimeTracking);
router.post("/:id/time/stop", stopTimeTracking);

// Comments and subtasks
router.post("/:id/comments", addComment);
router.put("/:id/subtasks", updateSubtask);

module.exports = router;
