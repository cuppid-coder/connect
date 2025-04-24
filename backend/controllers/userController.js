const User = require("../models/User");
const admin = require('firebase-admin');

// Register or sync user from Firebase
exports.registerOrSync = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token is required" });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    // Check if user exists
    let user = await User.findOne({ firebaseUID: decodedToken.uid });
    
    if (!user) {
      // Create new user
      user = new User({
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        firebaseUID: decodedToken.uid,
        avatar: decodedToken.picture || "",
      });
      await user.save();
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("teams", "name");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("teams", "name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, avatar, preferences } = req.body;
    const updates = { name, email, avatar, preferences };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user status
exports.updateStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          status,
          lastSeen: Date.now(),
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Revoke user access
exports.revokeAccess = async (req, res) => {
  try {
    const { firebaseUID } = req.params;

    // Revoke Firebase tokens
    await admin.auth().revokeRefreshTokens(firebaseUID);
    
    // Update user status
    await User.findOneAndUpdate(
      { firebaseUID },
      { 
        $set: { 
          status: 'offline',
          lastSeen: Date.now(),
          socketId: null
        }
      }
    );

    res.status(200).json({ message: 'User access revoked successfully' });
  } catch (error) {
    console.error('Revoke access error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Send contact request
exports.sendContactRequest = async (req, res) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.user._id;

    // Check if users exist
    const [toUser, fromUser] = await Promise.all([
      User.findById(toUserId),
      User.findById(fromUserId)
    ]);

    if (!toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request already exists
    const existingRequest = toUser.contactRequests.find(
      request => request.from.toString() === fromUserId.toString()
    );
    if (existingRequest) {
      return res.status(400).json({ message: "Contact request already sent" });
    }

    // Check if they are already contacts
    const isContact = toUser.contacts.some(
      contact => contact.user.toString() === fromUserId.toString()
    );
    if (isContact) {
      return res.status(400).json({ message: "Users are already contacts" });
    }

    // Add request to recipient's requests
    toUser.contactRequests.push({ from: fromUserId });
    await toUser.save();

    // Create notification for recipient
    await createNotification({
      recipient: toUserId,
      type: "CONTACT_REQUEST",
      title: "New Contact Request",
      content: `${fromUser.name} wants to add you as a contact`,
      reference: {
        model: "User",
        id: fromUserId
      }
    });

    res.status(200).json({ message: "Contact request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handle contact request (accept/reject)
exports.handleContactRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = user.contactRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (action === 'accept') {
      // Add each user to the other's contacts
      await Promise.all([
        User.findByIdAndUpdate(userId, {
          $push: { contacts: { user: request.from } },
          $pull: { contactRequests: { _id: requestId } }
        }),
        User.findByIdAndUpdate(request.from, {
          $push: { contacts: { user: userId } }
        })
      ]);

      // Create notification for sender
      await createNotification({
        recipient: request.from,
        type: "CONTACT_ACCEPTED",
        title: "Contact Request Accepted",
        content: `${user.name} accepted your contact request`,
        reference: {
          model: "User",
          id: userId
        }
      });
    } else {
      // Remove request if rejected
      await User.findByIdAndUpdate(userId, {
        $pull: { contactRequests: { _id: requestId } }
      });
    }

    res.status(200).json({ message: `Contact request ${action}ed successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user contacts
exports.getContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .populate('contacts.user', 'name email avatar status lastSeen')
      .populate('contactRequests.from', 'name email avatar');

    res.status(200).json({
      contacts: user.contacts,
      pendingRequests: user.contactRequests.filter(r => r.status === 'pending')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove contact
exports.removeContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;

    // Remove contact from both users
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { contacts: { user: contactId } }
      }),
      User.findByIdAndUpdate(contactId, {
        $pull: { contacts: { user: userId } }
      })
    ]);

    res.status(200).json({ message: "Contact removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;

    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email avatar status lastSeen')
    .limit(10);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Demo endpoint to send a friend request
exports.sendDemoFriendRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const fromUserId = req.user._id;

    // Get socket manager instance
    const socketManager = global.app.get("socketManager");
    
    // Create a notification for the friend request
    await createNotification({
      recipient: targetUserId,
      type: "CONTACT_REQUEST",
      title: "New Friend Request",
      content: `${req.user.name} sent you a friend request`,
      reference: {
        model: "User",
        id: fromUserId
      }
    });

    // Handle the friend request through socket
    await socketManager.handleFriendRequest(req.user, targetUserId);

    res.json({ success: true, message: "Friend request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Demo endpoint to handle friend request response
exports.handleDemoFriendRequest = async (req, res) => {
  try {
    const { requestId, accept } = req.body;
    const socketManager = global.app.get("socketManager");

    const request = await Notification.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update the notification status
    request.read = true;
    await request.save();

    // Handle the response through socket
    await socketManager.handleFriendRequest(req.user, request.reference.id, accept);

    if (accept) {
      // Create acceptance notification
      await createNotification({
        recipient: request.reference.id,
        type: "CONTACT_ACCEPTED",
        title: "Friend Request Accepted",
        content: `${req.user.name} accepted your friend request`,
        reference: {
          model: "User",
          id: req.user._id
        }
      });
    }

    res.json({ success: true, message: `Friend request ${accept ? 'accepted' : 'declined'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Demo endpoint to request direct message
exports.requestDemoDirectMessage = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const socketManager = global.app.get("socketManager");

    // Create notification for message request
    await createNotification({
      recipient: targetUserId,
      type: "MESSAGE_REQUEST",
      title: "New Message Request",
      content: `${req.user.name} wants to send you a message`,
      reference: {
        model: "User",
        id: req.user._id
      }
    });

    // Handle the message request through socket
    await socketManager.handleMessageRequest(req.user, targetUserId);

    res.json({ success: true, message: "Message request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
