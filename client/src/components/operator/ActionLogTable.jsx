import React from 'react';

export default function ActionLogTable({ logs, handleClearLogs }) {
  return (
    <div className="glass-card" style={{ marginBottom: 0, padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Log Mutasi Skor</h2>
        <button
          className="btn"
          onClick={handleClearLogs}
          style={{
            background: 'transparent',
            color: '#f97316',
            border: '0.1rem solid rgba(249, 115, 22, 0.5)',
            padding: '0.6rem 1.2rem',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title="Bersihkan Histori Log"
        >
          {/* Trash SVG */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          Bersihkan Log
        </button>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxHeight: '30rem',
        overflowY: 'auto',
        marginTop: '1.5rem',
        paddingRight: '0.5rem'
      }}>
        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', textAlign: 'center' }}>
            Belum ada mutasi skor.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                background: 'rgba(255,255,255,0.01)',
                borderLeft: `0.3rem solid ${log.change_value >= 0 ? '#10b981' : '#ef4444'}`,
                padding: '0.8rem 1.2rem',
                borderRadius: '0.4rem',
                fontSize: '1.2rem'
              }}
            >
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                <span>{log.timestamp}</span>
                <strong>{log.round_name}</strong>
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                Tim <strong>{log.team_name}</strong>:{' '}
                <span style={{ color: log.change_value >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                  {log.change_value >= 0 ? `+${log.change_value}` : log.change_value} Poin
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                {log.description}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
