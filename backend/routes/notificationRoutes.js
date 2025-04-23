const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

router.get("/", getNotifications);
router.put("/mark-read", markAsRead);
router.put("/mark-all-read", markAllAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
