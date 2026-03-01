/**
 * UserPresence Component
 * 
 * Displays active collaborators in the room with color-coded
 * avatars. Shows owner badge and cursor position info.
 */

import React from 'react';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

function UserPresence({ users }) {
  return (
    <div className="user-presence">
      {users.map((user, index) => (
        <div
          key={user.sid || index}
          className="user-avatar"
          style={{ backgroundColor: COLORS[index % COLORS.length] }}
          title={`${user.username}${user.is_owner ? ' (Owner)' : ''}`}
        >
          {user.username?.charAt(0)?.toUpperCase() || '?'}
          {user.is_owner && <span className="crown">👑</span>}
        </div>
      ))}
      {users.length > 0 && (
        <span className="user-count">{users.length} online</span>
      )}
    </div>
  );
}

export default UserPresence;
