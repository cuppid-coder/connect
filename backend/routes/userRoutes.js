const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  registerOrSync,
  updateUser,
  updateStatus,
  revokeAccess,
  sendContactRequest,
  handleContactRequest,
  getContacts,
  removeContact,
  searchUsers,
  sendDemoFriendRequest,
  handleDemoFriendRequest,
  requestDemoDirectMessage
} = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Public routes
router.post("/auth/register-or-sync", registerOrSync);

// Protected routes
router.get("/", authMiddleware, getUsers);
router.get("/search", authMiddleware, searchUsers);
router.get("/contacts", authMiddleware, getContacts);
router.post("/contacts/request", authMiddleware, sendContactRequest);
router.post("/contacts/handle-request", authMiddleware, handleContactRequest);
router.delete("/contacts/:contactId", authMiddleware, removeContact);
router.get("/:id", authMiddleware, getUser);
router.put("/:id", authMiddleware, updateUser);
router.put("/status", authMiddleware, updateStatus);
router.post("/revoke/:firebaseUID", authMiddleware, revokeAccess);

// New demo routes
router.post("/demo/friend-request", authMiddleware, sendDemoFriendRequest);
router.post("/demo/handle-friend-request", authMiddleware, handleDemoFriendRequest);
router.post("/demo/message-request", authMiddleware, requestDemoDirectMessage);

module.exports = router;
