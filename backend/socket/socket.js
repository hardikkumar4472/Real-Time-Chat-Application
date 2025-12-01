const jwt = require('jsonwebtoken');
const User = require('../models/User');

const configureSocket = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user._id;
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.username} connected`);

    // Join user to their personal room
    socket.join(socket.userId.toString());

    // Update user online status
    User.findByIdAndUpdate(socket.userId, { 
      isOnline: true,
      lastSeen: new Date()
    }).exec();

    // Handle joining chat room
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.username} joined chat: ${chatId}`);
    });

    // Handle leaving chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.username} left chat: ${chatId}`);
    });

    // Handle new message
    socket.on('send_message', (messageData) => {
      // Broadcast to all users in the chat except sender
      socket.to(messageData.chat).emit('receive_message', messageData);
    });

    // Handle message edit
    socket.on('edit_message', (data) => {
      // Broadcast edited message to all users in the chat
      socket.to(data.chatId).emit('message_edited', data);
    });

    // Handle message deletion
    socket.on('delete_message', (data) => {
      // Broadcast deletion to all users in the chat
      socket.to(data.chatId).emit('message_deleted', {
        messageId: data.messageId,
        chatId: data.chatId
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (chatId) => {
      socket.to(chatId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username
      });
    });

    socket.on('typing_stop', (chatId) => {
      socket.to(chatId).emit('user_stop_typing', {
        userId: socket.userId
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.username} disconnected`);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      }).exec();

      // Notify other users about offline status
      socket.broadcast.emit('user_offline', { userId: socket.userId });
    });
  });
};

module.exports = configureSocket;