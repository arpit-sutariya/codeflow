import React from 'react';

function PendingChangesPanel({ changes, onAccept, onReject }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pending-panel">
      <div className="pending-header">
        <span>📝 Pending Changes ({changes.length})</span>
      </div>
      <div className="pending-list">
        {changes.map((change) => (
          <div key={change.id} className="pending-item">
            <div className="pending-info">
              <span className="pending-author">👤 {change.author}</span>
              <span className="pending-time">{formatTime(change.timestamp)}</span>
              <span className="pending-desc">{change.description || 'Pending change'}</span>
            </div>
            <div className="pending-actions">
              <button className="btn-accept" onClick={() => onAccept(change.id)}>
                ✅ Accept
              </button>
              <button className="btn-reject" onClick={() => onReject(change.id)}>
                ❌ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingChangesPanel;
