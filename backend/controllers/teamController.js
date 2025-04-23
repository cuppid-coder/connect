const Team = require("../models/Team");
const User = require("../models/User");

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("owner", "name email")
      .populate("members", "name email status");
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create team
exports.createTeam = async (req, res) => {
  try {
    const { name, description, openPositions, isPublic, ownerId } = req.body;

    const team = new Team({
      name,
      description,
      owner: ownerId,
      isPublic,
      openPositions: openPositions.map((pos) => ({ title: pos })),
      members: [ownerId], // Owner is automatically a member
    });

    const savedTeam = await team.save();

    // Add team to owner's teams
    await User.findByIdAndUpdate(ownerId, {
      $addToSet: { teams: savedTeam._id },
    });

    const populatedTeam = await Team.findById(savedTeam._id)
      .populate("owner", "name email")
      .populate("members", "name email status");

    // Emit team creation event
    req.app.get("io").emit("team_created", populatedTeam);

    res.status(201).json(populatedTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Join team
exports.joinTeam = async (req, res) => {
  try {
    const { teamId, userId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!team.isPublic) {
      return res.status(403).json({ message: "This team is private" });
    }

    // Add member to team
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: userId } },
      { new: true }
    )
      .populate("owner", "name email")
      .populate("members", "name email status");

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, {
      $addToSet: { teams: teamId },
    });

    // Emit team update event
    req.app.get("io").emit("team_updated", updatedTeam);

    res.status(200).json(updatedTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Leave team
exports.leaveTeam = async (req, res) => {
  try {
    const { teamId, userId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.owner.toString() === userId) {
      return res
        .status(403)
        .json({ message: "Team owner cannot leave the team" });
    }

    // Remove member from team
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { $pull: { members: userId } },
      { new: true }
    )
      .populate("owner", "name email")
      .populate("members", "name email status");

    // Remove team from user's teams
    await User.findByIdAndUpdate(userId, {
      $pull: { teams: teamId },
    });

    // Emit team update event
    req.app.get("io").emit("team_updated", updatedTeam);

    res.status(200).json(updatedTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { $set: updates },
      { new: true }
    )
      .populate("owner", "name email")
      .populate("members", "name email status");

    // Emit team update event
    req.app.get("io").emit("team_updated", updatedTeam);

    res.status(200).json(updatedTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
