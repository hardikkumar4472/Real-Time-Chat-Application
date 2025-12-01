const Message = require('../models/Message');
const Chat = require('../models/Chat');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({ message: 'Content and chat ID are required' });
    }

    // Create message
    const message = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content: content,
    });

    // Populate the message with sender details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture');

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse()); // Reverse to get chronological order
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:messageId
// @access  Private
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user._id // Only sender can edit
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'username profilePicture');

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a message (completely remove from database)
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user._id // Only sender can delete
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    // Completely remove the message from database
    await Message.findByIdAndDelete(messageId);

    res.json({ message: 'Message deleted successfully', deletedMessageId: messageId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendMessage, getMessages, editMessage, deleteMessage };