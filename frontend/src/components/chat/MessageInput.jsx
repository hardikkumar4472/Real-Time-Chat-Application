import React, { useState, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import './MessageInput.css';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { selectedChat, sendMessage } = useChat();
  const socket = useSocket();
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedChat) return;

    try {
      const sentMessage = await sendMessage(message.trim());
      
      // Emit socket event for real-time delivery
      socket.emit('send_message', sentMessage);
      
      setMessage('');
      adjustTextareaHeight();
      
      // Stop typing indicator
      socket.emit('typing_stop', selectedChat._id);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
    handleTyping();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleTyping = () => {
    if (!selectedChat || !socket) return;

    if (!isTyping) {
      socket.emit('typing_start', selectedChat._id);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', selectedChat._id);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!selectedChat) {
    return null;
  }

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="message-textarea"
          />
          <button 
            type="submit" 
            disabled={!message.trim()}
            className="send-button"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;