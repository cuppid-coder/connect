const express = require("express");
const router = express.Router();
const {
  getMessages,
  getUserChats,
  createChat,
  sendMessage,
  markAsRead,
} = require("../controllers/messageController");

// Chat routes
router.get("/chat/:chatId", getMessages);
router.get("/user/:userId/chats", getUserChats);
router.post("/chat", createChat);
router.post("/", sendMessage);
router.put("/read", markAsRead);

module.exports = router;
