import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import './ChatList.css';

const ChatList = () => {
  const { chats, selectedChat, selectChat, loading } = useChat();

  const getOtherParticipant = (chat) => {
    return chat.participants.find(participant => 
      participant._id !== JSON.parse(localStorage.getItem('user'))._id
    );
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const isYou = chat.lastMessage.sender._id === JSON.parse(localStorage.getItem('user'))._id;
    const prefix = isYou ? 'You: ' : '';
    
    return prefix + chat.lastMessage.content;
  };

  if (loading) {
    return <div className="chat-list loading">Loading chats...</div>;
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h3>Chats</h3>
      </div>
      
      <div className="chat-items">
        {chats.map(chat => {
          const otherUser = getOtherParticipant(chat);
          const isSelected = selectedChat && selectedChat._id === chat._id;
          
          return (
            <div
              key={chat._id}
              className={`chat-item ${isSelected ? 'selected' : ''}`}
              onClick={() => selectChat(chat)}
            >
              <div className="chat-avatar">
                {otherUser.profilePicture ? (
                  <img src={otherUser.profilePicture} alt={otherUser.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {otherUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`online-status ${otherUser.isOnline ? 'online' : 'offline'}`} />
              </div>
              
              <div className="chat-info">
                <div className="chat-header">
                  <h4>{otherUser.username}</h4>
                  {chat.lastMessage && (
                    <span className="message-time">
                      {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                
                <p className="last-message">
                  {getLastMessagePreview(chat)}
                </p>
              </div>
            </div>
          );
        })}
        
        {chats.length === 0 && (
          <div className="no-chats">
            <p>No chats yet</p>
            <span>Start a new conversation!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;