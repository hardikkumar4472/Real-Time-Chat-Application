import React from 'react';
import Sidebar from '../Layout/Sidebar';
import ChatList from './ChatList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatInterface.css';

const ChatInterface = () => {
  return (
    <div className="chat-interface">
      <div className="sidebar-panel">
        <Sidebar />
        <ChatList />
      </div>
      
      <div className="chat-panel">
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatInterface;