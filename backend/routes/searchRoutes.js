const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// Global search across all entities
router.get("/global", (req, res, next) =>
  searchController.globalSearch(req, res, next)
);

// Advanced search with filters
router.get("/advanced", (req, res, next) =>
  searchController.advancedSearch(req, res, next)
);

// Message search
router.get("/messages", (req, res, next) =>
  searchController.searchMessages(req, res, next)
);

// Get tags for different entities
router.get("/tags/:type", (req, res, next) =>
  searchController.getTags(req, res, next)
);

module.exports = router;
