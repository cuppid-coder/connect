const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getOnlineUsers,
  getPendingRequests,
  getMessageRequests
} = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

router.get("/online-users", getOnlineUsers);
router.get("/pending-requests", getPendingRequests);
router.get("/message-requests", getMessageRequests);

module.exports = router;
