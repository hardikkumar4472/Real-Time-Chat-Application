import api from './api';

export const messageService = {
  sendMessage: (data) => {
    return api.post('/messages', data);
  },

  getMessages: (chatId, page = 1, limit = 50) => {
    return api.get(`/messages/${chatId}?page=${page}&limit=${limit}`);
  },

  editMessage: (messageId, data) => {
    return api.put(`/messages/${messageId}`, data);
  },

  deleteMessage: (messageId) => {
    return api.delete(`/messages/${messageId}`);
  }
};