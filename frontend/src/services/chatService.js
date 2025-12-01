import api from './api';

export const chatService = {
  getUserChats: () => {
    return api.get('/chats');
  },

  createChat: (data) => {
    return api.post('/chats', data);
  }
};