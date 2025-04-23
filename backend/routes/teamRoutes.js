const express = require("express");
const router = express.Router();
const {
  getTeams,
  createTeam,
  joinTeam,
  leaveTeam,
  updateTeam,
} = require("../controllers/teamController");

router.get("/", getTeams);
router.post("/", createTeam);
router.post("/join", joinTeam);
router.post("/leave", leaveTeam);
router.put("/:teamId", updateTeam);

module.exports = router;
