const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  register,
  login,
  updateUser,
  updateStatus,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/", authenticate, getUsers);
router.get("/:id", authenticate, getUser);
router.put("/:id", authenticate, updateUser);
router.put("/status", authenticate, updateStatus);

module.exports = router;
