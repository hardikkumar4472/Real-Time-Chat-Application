import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { chatService } from '../../services/chatService';
import toast from 'react-hot-toast';
import './Sidebar.css';

const Sidebar = () => {
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const { user, logout } = useAuth();
  const { createChat, selectChat } = useChat();

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // In a real app, you'd have a user search endpoint
      // For now, we'll simulate this
      const response = await chatService.getUserChats();
      const allUsers = response.data.flatMap(chat => 
        chat.participants.filter(p => p._id !== user._id)
      );
      
      const filtered = allUsers.filter(user => 
        user.username.toLowerCase().includes(term.toLowerCase())
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateChat = async (participant) => {
    try {
      const chat = await createChat(participant._id);
      selectChat(chat);
      setShowNewChat(false);
      setSearchTerm('');
      setSearchResults([]);
      toast.success(`Started chat with ${participant.username}`);
    } catch (error) {
      toast.error('Error creating chat');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span>Welcome, {user.username}</span>
        </div>
        <div className="sidebar-actions">
          <button 
            className="new-chat-btn"
            onClick={() => setShowNewChat(true)}
            title="New Chat"
          >
            +
          </button>
          <button onClick={logout} className="logout-btn" title="Logout">
            ⎋
          </button>
        </div>
      </div>

      {showNewChat && (
        <div className="new-chat-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>New Chat</h3>
              <button onClick={() => setShowNewChat(false)}>×</button>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <div className="search-results">
              {searching && <div>Searching...</div>}
              {searchResults.map(user => (
                <div
                  key={user._id}
                  className="search-result-item"
                  onClick={() => handleCreateChat(user)}
                >
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{user.username}</span>
                </div>
              ))}
              {searchResults.length === 0 && searchTerm && !searching && (
                <div className="no-results">No users found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;