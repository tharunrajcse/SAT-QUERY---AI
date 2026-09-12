import React from 'react';
import { SatelliteDishIcon, OrbitSatelliteIcon, TrashIcon } from './Icons';

export default function LeftSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  collapsed,
  onToggleCollapse,
  currentMode = 'bi_temporal'
}) {
  const isSarOptical = currentMode === 'sar_optical';

  // Strict session filtering to prevent chat cross-contamination
  const filteredSessions = sessions.filter(sess => {
    if (isSarOptical) {
      return sess.mode === 'sar_optical' || (sess.title && sess.title.toLowerCase().includes('closp'));
    }
    return sess.mode === 'bi_temporal' || !sess.mode || (sess.title && !sess.title.toLowerCase().includes('closp'));
  });

  return (
    <div className={`left-sidebar ${collapsed ? 'collapsed' : ''}`} style={isSarOptical ? { background: '#10081c', borderRightColor: 'rgba(242, 84, 91, 0.25)' } : {}}>
      {/* Sidebar Top Header & New Chat Button */}
      <div className="sidebar-header" style={isSarOptical ? { borderBottomColor: 'rgba(242, 84, 91, 0.25)' } : {}}>
        <button
          className="cosmic-btn-pill cosmic-btn-solid btn-new-chat"
          style={isSarOptical ? { background: 'linear-gradient(135deg, #f2545b, #7209b7)', borderColor: '#f2545b' } : {}}
          onClick={onNewChat}
        >
          <span>+</span> {!collapsed && 'New Chat'}
        </button>
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? '❯' : '❮'}
        </button>
      </div>

      {/* History Sessions List */}
      {!collapsed && (
        <div className="sidebar-history">
          <div className="history-title" style={isSarOptical ? { color: '#ff9ebb', display: 'flex', alignItems: 'center', gap: '8px' } : { display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSarOptical ? <SatelliteDishIcon size={18} color="#f2545b" /> : <OrbitSatelliteIcon size={18} color="#48cae4" />}
            <span>{isSarOptical ? 'SAR & Optical History' : 'Bi-Temporal History'}</span>
          </div>
          {filteredSessions.length === 0 ? (
            <div className="empty-history">
              {isSarOptical ? 'No SAR / Optical analyses yet.' : 'No Bi-Temporal analyses yet.'}
            </div>
          ) : (
            <div className="history-list">
              {filteredSessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`history-item ${sess.id === activeSessionId ? 'active' : ''}`}
                  style={isSarOptical && sess.id === activeSessionId ? { borderLeftColor: '#f2545b', background: 'rgba(242, 84, 91, 0.15)' } : {}}
                  onClick={() => onSelectSession(sess.id)}
                >
                  <div className="history-item-content">
                    <span className="history-icon" style={{ display: 'flex', alignItems: 'center' }}>
                      {isSarOptical ? <SatelliteDishIcon size={16} color="#f2545b" /> : <OrbitSatelliteIcon size={16} color="#48cae4" />}
                    </span>
                    <div className="history-text">
                      <div className="history-label" style={isSarOptical ? { color: '#ffffff' } : {}}>
                        {sess.title || (isSarOptical ? 'CLOSP Analysis' : 'Bi-Temporal Analysis')}
                      </div>
                      <div className="history-date">{sess.date}</div>
                    </div>
                  </div>

                  <button
                    className="history-delete-btn"
                    title="Delete session"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sess.id);
                    }}
                  >
                    <TrashIcon size={14} color="#94a3b8" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
