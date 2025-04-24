const Team = require("../models/Team");
const User = require("../models/User");

// Get all teams with visibility filtering
exports.getTeams = async (req, res) => {
  try {
    const query = {};
    
    // If user is not authenticated, only show public teams
    if (!req.user) {
      query.visibility = 'public';
    } else {
      // Show public teams and teams where user is a member
      query.$or = [
        { visibility: 'public' },
        { visibility: 'request_to_join' },
        { 'members.user': req.user._id }
      ];
    }

    const teams = await Team.find(query)
      .populate("owner", "name email")
      .populate("members.user", "name email status");
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

// Request to join team
exports.requestToJoin = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user can join based on visibility settings
    if (team.visibility === 'private') {
      return res.status(403).json({ message: "This team is private" });
    }

    if (team.visibility === 'public') {
      // Auto-join for public teams
      team.members.push({ user: userId });
      await team.save();
      
      // Send notification
      await createNotification({
        recipient: team.leader,
        type: "TEAM_JOIN",
        title: "New Team Member",
        content: `A new user has joined your team ${team.name}`,
        reference: { model: "Team", id: team._id }
      });

      return res.status(200).json(team);
    }

    // Handle request_to_join teams
    const existingRequest = team.joinRequests.find(
      request => request.user.toString() === userId.toString()
    );

    if (existingRequest) {
      return res.status(400).json({ message: "Join request already exists" });
    }

    team.joinRequests.push({ user: userId });
    await team.save();

    // Notify team leader
    await createNotification({
      recipient: team.leader,
      type: "TEAM_INVITE",
      title: "Team Join Request",
      content: `A user has requested to join your team ${team.name}`,
      reference: { model: "Team", id: team._id }
    });

    res.status(200).json({ message: "Join request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handle join request
exports.handleJoinRequest = async (req, res) => {
  try {
    const { teamId, userId, status } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const requestIndex = team.joinRequests.findIndex(
      request => request.user.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Join request not found" });
    }

    team.joinRequests[requestIndex].status = status;

    if (status === 'approved') {
      team.members.push({ user: userId });
      // Notify user of approval
      await createNotification({
        recipient: userId,
        type: "TEAM_INVITE",
        title: "Team Join Request Approved",
        content: `Your request to join ${team.name} has been approved`,
        reference: { model: "Team", id: team._id }
      });
    } else {
      // Notify user of rejection
      await createNotification({
        recipient: userId,
        type: "TEAM_INVITE",
        title: "Team Join Request Rejected",
        content: `Your request to join ${team.name} has been rejected`,
        reference: { model: "Team", id: team._id }
      });
    }

    await team.save();
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
