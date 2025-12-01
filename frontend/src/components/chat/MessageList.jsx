import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import Message from './Message';
import './MessageList.css';

const MessageList = () => {
  const { messages, selectedChat } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!selectedChat) {
    return (
      <div className="message-list no-chat">
        <div className="no-chat-selected">
          <h3>Select a chat to start messaging</h3>
          <p>Choose a conversation from the list or start a new one</p>
        </div>
      </div>
    );
  }

  const getOtherParticipant = () => {
    return selectedChat.participants.find(participant => participant._id !== user._id);
  };

  const otherUser = getOtherParticipant();

  return (
    <div className="message-list">
      <div className="message-header">
        <div className="chat-user-info">
          {otherUser.profilePicture ? (
            <img src={otherUser.profilePicture} alt={otherUser.username} />
          ) : (
            <div className="avatar-placeholder">
              {otherUser.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3>{otherUser.username}</h3>
            <span className={`user-status ${otherUser.isOnline ? 'online' : 'offline'}`}>
              {otherUser.isOnline ? 'Online' : `Last seen ${format(new Date(otherUser.lastSeen), 'PPp')}`}
            </span>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet</p>
            <span>Send a message to start the conversation</span>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message._id}
              message={message}
              isOwn={message.sender._id === user._id}
              isEditing={editingMessage === message._id}
              onEditStart={() => setEditingMessage(message._id)}
              onEditCancel={() => setEditingMessage(null)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;