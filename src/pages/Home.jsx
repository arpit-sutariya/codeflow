import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setRoomInfo } from '../store/store';
import socketManager from '../utils/socketManager';

function Home() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleCreate = async () => {
    if (!username.trim()) return alert('Enter a username');
    const newRoomId = roomId.trim() || Math.random().toString(36).substring(2, 8);
    socketManager.connect();
    dispatch(setRoomInfo({ roomId: newRoomId, isOwner: true, username }));
    await socketManager.createRoom(newRoomId, username);
    navigate(`/editor/${newRoomId}`);
  };

  const handleJoin = () => {
    if (!username.trim()) return alert('Enter a username');
    if (!roomId.trim()) return alert('Enter a room ID');
    socketManager.connect();
    dispatch(setRoomInfo({ roomId: roomId.trim(), isOwner: false, username }));
    socketManager.joinRoom(roomId.trim(), username);
    navigate(`/editor/${roomId.trim()}`);
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="logo">
          <span className="logo-icon">⟨/⟩</span>
          <h1>CodeFlow</h1>
        </div>
        <p className="tagline">Real-time collaborative code editor</p>

        <div className="tab-switch">
          <button
            className={`tab ${isCreating ? 'active' : ''}`}
            onClick={() => setIsCreating(true)}
          >
            Create Room
          </button>
          <button
            className={`tab ${!isCreating ? 'active' : ''}`}
            onClick={() => setIsCreating(false)}
          >
            Join Room
          </button>
        </div>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label>{isCreating ? 'Room ID (optional)' : 'Room ID'}</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder={isCreating ? 'Auto-generated if empty' : 'Enter room ID to join'}
          />
        </div>

        <button
          className="btn-primary"
          onClick={isCreating ? handleCreate : handleJoin}
        >
          {isCreating ? 'Create Room' : 'Join Room'}
        </button>

        <div className="features-list">
          <div className="feature">
            <span>🔄</span> Real-time OT-based collaboration
          </div>
          <div className="feature">
            <span>▶️</span> Multi-language code execution
          </div>
          <div className="feature">
            <span>👁️</span> Live HTML/CSS/JS preview
          </div>
          <div className="feature">
            <span>✅</span> Owner accept/reject workflow
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
