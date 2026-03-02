const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get messages for a client thread
exports.getMessages = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (req.user.role === 'client' && String(req.user.clientId) !== String(clientId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const messages = await Message.find({ client: clientId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text is required' });

    if (req.user.role === 'client' && String(req.user.clientId) !== String(clientId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user.id);
    const message = new Message({
      client: clientId,
      sender: req.user.id,
      senderName: user?.username || 'Unknown',
      senderRole: req.user.role,
      text: text.trim(),
      readBy: [req.user.id],
    });
    await message.save();

    // Notify the other party
    if (req.user.role === 'client') {
      // Notify assigned staff
      const staffUsers = await User.find({ role: { $in: ['partner', 'seniorCA'] } });
      for (const staff of staffUsers) {
        await Notification.create({
          recipient: staff._id,
          type: 'general',
          title: 'New Client Message',
          message: `Message from ${user?.username}: ${text.substring(0, 80)}`,
          link: `/clients/${clientId}`,
        });
      }
    } else {
      // Notify the client user
      const clientUser = await User.findOne({ clientId, role: 'client' });
      if (clientUser) {
        await Notification.create({
          recipient: clientUser._id,
          type: 'general',
          title: 'New Message from CA Firm',
          message: `${user?.username}: ${text.substring(0, 80)}`,
          link: '/portal/messages',
        });
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message' });
  }
};

// Get unread count for a client thread
exports.getUnreadCount = async (req, res) => {
  try {
    const { clientId } = req.params;
    const count = await Message.countDocuments({
      client: clientId,
      readBy: { $ne: req.user.id },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error getting unread count' });
  }
};

// Mark all messages in thread as read
exports.markRead = async (req, res) => {
  try {
    const { clientId } = req.params;
    await Message.updateMany(
      { client: clientId, readBy: { $ne: req.user.id } },
      { $push: { readBy: req.user.id } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages read' });
  }
};
