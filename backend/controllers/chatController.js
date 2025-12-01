const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

// @desc    Get or create one-on-one chat
// @route   POST /api/chats
// @access  Private
const getOrCreateChat = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] }
    }).populate('participants', 'username email profilePicture isOnline');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = await Chat.create({
      participants: [req.user._id, participantId]
    });

    chat = await Chat.findById(chat._id).populate('participants', 'username email profilePicture isOnline');

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all chats for user
// @route   GET /api/chats
// @access  Private
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.user._id] }
    })
    .populate('participants', 'username email profilePicture isOnline')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getOrCreateChat, getUserChats };