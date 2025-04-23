const Message = require("../models/Message");
const User = require("../models/User");

// Get messages for a specific chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender", "name avatar status")
      .populate("receiver", "name avatar status")
      .populate("readBy", "name");

    const total = await Message.countDocuments({ chatId });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all chats for a user
exports.getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all messages where user is either sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name avatar status")
      .populate("receiver", "name avatar status")
      .populate("readBy", "name");

    // Group messages by chat
    const chats = messages.reduce((acc, message) => {
      if (!acc[message.chatId]) {
        acc[message.chatId] = {
          lastMessage: message,
          messages: [],
          unreadCount: 0,
        };
      }
      acc[message.chatId].messages.push(message);
      if (!message.readBy.some((user) => user._id.toString() === userId)) {
        acc[message.chatId].unreadCount++;
      }
      return acc;
    }, {});

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    const { users, type, name } = req.body;
    const sender = req.user;

    if (!users || users.length === 0) {
      return res.status(400).json({ message: "No users specified" });
    }

    // Generate chat ID based on type
    const chatId =
      type === "private"
        ? `private-${[sender._id, users[0]._id].sort().join("-")}`
        : `group-${Date.now()}`;

    // Create initial message
    const message = new Message({
      content:
        type === "private"
          ? "Started a conversation"
          : `Created group "${name}"`,
      sender: sender._id,
      receiver: type === "private" ? users[0]._id : undefined,
      chatId,
      chatType: type,
      readBy: [sender._id],
    });

    await message.save();

    // Notify participants through WebSocket
    const socketManager = req.app.get("socketManager");
    socketManager.notifyNewMessage(chatId, {
      ...message.toObject(),
      sender: { _id: sender._id, name: sender.name },
      receiver: type === "private" ? { _id: users[0]._id } : undefined,
    });

    res.json({ chatId, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { content, chatId, attachments } = req.body;
    const sender = req.user;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Determine chat type and receiver from chatId
    const [type, ...userIds] = chatId.split("-");
    const message = new Message({
      content,
      sender: sender._id,
      receiver:
        type === "private"
          ? userIds.find((id) => id !== sender._id.toString())
          : undefined,
      chatId,
      chatType: type,
      attachments,
      readBy: [sender._id],
    });

    await message.save();
    await message.populate("sender", "name avatar status");
    if (message.receiver) {
      await message.populate("receiver", "name avatar status");
    }

    // Notify participants through WebSocket
    const socketManager = req.app.get("socketManager");
    socketManager.notifyNewMessage(chatId, message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const user = req.user;

    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: user._id } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
