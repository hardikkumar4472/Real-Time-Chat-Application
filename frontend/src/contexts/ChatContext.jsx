import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chatService';
import { messageService } from '../services/messageServices';

const ChatContext = createContext();

// Action types
const ACTION_TYPES = {
  SET_CHATS: 'SET_CHATS',
  SET_SELECTED_CHAT: 'SET_SELECTED_CHAT',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_CHAT: 'ADD_CHAT',
  UPDATE_CHAT_LAST_MESSAGE: 'UPDATE_CHAT_LAST_MESSAGE',
  SET_LOADING: 'SET_LOADING',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS'
};

// Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_CHATS:
      return { ...state, chats: action.payload };
    
    case ACTION_TYPES.SET_SELECTED_CHAT:
      return { ...state, selectedChat: action.payload };
    
    case ACTION_TYPES.ADD_MESSAGE:
      const updatedChats = state.chats.map(chat => 
        chat._id === action.payload.chat 
          ? { ...chat, lastMessage: action.payload }
          : chat
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return {
        ...state,
        chats: updatedChats,
        messages: [action.payload, ...state.messages]
      };
    
    case ACTION_TYPES.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case ACTION_TYPES.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg._id === action.payload._id ? action.payload : msg
        )
      };
    
    case ACTION_TYPES.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(msg => msg._id !== action.payload)
      };
    
    case ACTION_TYPES.ADD_CHAT:
      return {
        ...state,
        chats: [action.payload, ...state.chats]
      };
    
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTION_TYPES.SET_ONLINE_USERS:
      return { ...state, onlineUsers: action.payload };
    
    default:
      return state;
  }
};

const initialState = {
  chats: [],
  selectedChat: null,
  messages: [],
  loading: false,
  onlineUsers: new Set()
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socket = useSocket();
  const { user } = useAuth();

  // Load user's chats
  const loadChats = async () => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      const response = await chatService.getUserChats();
      dispatch({ type: ACTION_TYPES.SET_CHATS, payload: response.data });
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Select a chat and load its messages
  const selectChat = async (chat) => {
    dispatch({ type: ACTION_TYPES.SET_SELECTED_CHAT, payload: chat });
    
    try {
      const response = await messageService.getMessages(chat._id);
      dispatch({ type: ACTION_TYPES.SET_MESSAGES, payload: response.data });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send a new message
  const sendMessage = async (content) => {
    if (!state.selectedChat) return;

    try {
      const response = await messageService.sendMessage({
        chatId: state.selectedChat._id,
        content
      });
      
      // The message will be added via socket event
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Edit a message
  const editMessage = async (messageId, content) => {
    try {
      const response = await messageService.editMessage(messageId, { content });
      dispatch({ type: ACTION_TYPES.UPDATE_MESSAGE, payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  };

  // Delete a message
  const deleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      dispatch({ type: ACTION_TYPES.DELETE_MESSAGE, payload: messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  // Create or get a chat with a user
  const createChat = async (participantId) => {
    try {
      const response = await chatService.createChat({ participantId });
      dispatch({ type: ACTION_TYPES.ADD_CHAT, payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    // Join user's personal room
    socket.emit('join_chat', user._id);

    // Message events
    socket.on('receive_message', (message) => {
      if (state.selectedChat && state.selectedChat._id === message.chat) {
        dispatch({ type: ACTION_TYPES.ADD_MESSAGE, payload: message });
      }
    });

    socket.on('message_edited', (data) => {
      dispatch({ type: ACTION_TYPES.UPDATE_MESSAGE, payload: data });
    });

    socket.on('message_deleted', (data) => {
      dispatch({ type: ACTION_TYPES.DELETE_MESSAGE, payload: data.messageId });
    });

    // Cleanup
    return () => {
      socket.off('receive_message');
      socket.off('message_edited');
      socket.off('message_deleted');
    };
  }, [socket, user, state.selectedChat]);

  // Load chats on component mount
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const value = {
    ...state,
    loadChats,
    selectChat,
    sendMessage,
    editMessage,
    deleteMessage,
    createChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};