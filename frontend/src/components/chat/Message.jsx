import React, { useState, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import { format } from 'date-fns';
import './Message.css';

const Message = ({ message, isOwn, isEditing, onEditStart, onEditCancel }) => {
  const { editMessage, deleteMessage } = useChat();
  const socket = useSocket();
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      try {
        const updatedMessage = await editMessage(message._id, editContent);
        
        // Emit socket event for real-time update
        socket.emit('edit_message', {
          ...updatedMessage,
          chatId: message.chat
        });
        
        onEditCancel();
      } catch (error) {
        console.error('Error editing message:', error);
      }
    } else {
      onEditCancel();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      try {
        await deleteMessage(message._id);
        
        // Emit socket event for real-time deletion
        socket.emit('delete_message', {
          messageId: message._id,
          chatId: message.chat
        });
        
        setShowMenu(false);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        {isEditing ? (
          <div className="message-edit">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              rows={1}
            />
            <div className="edit-actions">
              <button onClick={handleEdit} className="save-edit">Save</button>
              <button onClick={onEditCancel} className="cancel-edit">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="message-bubble">
              <p>{message.content}</p>
              
              {isOwn && (
                <div className="message-menu" ref={menuRef}>
                  <button 
                    className="menu-trigger"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    ⋮
                  </button>
                  
                  {showMenu && (
                    <div className="message-actions">
                      <button onClick={onEditStart}>Edit</button>
                      <button onClick={handleDelete} className="delete">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="message-meta">
              <span className="message-time">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {message.isEdited && (
                <span className="edited-badge">edited</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Message;