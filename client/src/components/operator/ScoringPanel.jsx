import React from 'react';

export default function ScoringPanel({ teams, activeRound, gameState, handleScoreChange, customValue, setCustomValue }) {
  return (
    <div className="glass-card" style={{ marginBottom: 0, height: '100%', padding: '1.5rem 2rem' }}>
      <h2 style={{ margin: 0 }}>Input Nilai Peserta</h2>
      
      {/* Banner Konteks Babak Aktif */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.15)',
        border: '0.1rem solid rgba(99, 102, 241, 0.3)',
        padding: '1.2rem 1.5rem',
        borderRadius: '0.8rem',
        color: '#c7d2fe',
        fontSize: '1.3rem',
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Info SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Anda sedang menilai di babak: <strong style={{ color: '#ffffff', fontSize: '1.4rem', textTransform: 'uppercase' }}>{activeRound?.name || 'Pilih Babak'}</strong></span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(20rem, calc(33.333% - 1rem)), 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {teams.map((team) => (
          <div key={team.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.8rem', padding: '1rem 1.2rem' }}>
            {/* Bagian Atas: Dot, Nama Tim, Skor (Stacked Centered Layout) */}
            <div style={{ position: 'relative', textAlign: 'center', marginBottom: '0.8rem', padding: '0' }}>
              {/* Dot Warna Tim (Kiri Atas) */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: '1.4rem', height: '1.4rem', borderRadius: '50%', backgroundColor: team.color, boxShadow: `0 0 1rem ${team.color}40` }} />
              
              {/* Teks Nama & Skor (Tengah) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0 2rem' }}>
                <strong style={{ fontSize: '1.8rem', color: '#ffffff', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.1, textAlign: 'center', wordBreak: 'break-word' }}>
                  {team.name}
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '2.8rem', fontWeight: 800, color: team.color, fontFamily: 'var(--font-outfit)', lineHeight: 1 }}>
                    {team.roundScores && gameState.activeRoundId ? (team.roundScores[gameState.activeRoundId] || 0) : team.score}
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Poin Babak Ini</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1.2rem', borderRadius: '1rem', marginTop: '0.5rem', border: '0.1rem solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                    Total Semua Babak: <strong style={{ color: '#ffffff', fontSize: '1.2rem' }}>{team.score}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Tambah/Kurang Poin Default Babak */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.2rem' }}>
              <button
                className="btn"
                style={{ padding: '1rem 0.5rem', fontSize: '1.2rem', background: 'var(--gradient-success)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: 'none', whiteSpace: 'nowrap' }}
                onClick={() => handleScoreChange(team.id, activeRound?.points_correct || 100, `Jawaban benar di babak ${activeRound?.name}`)}
              >
                {/* Check SVG */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <strong>+{activeRound?.points_correct || 100} Benar</strong>
              </button>
              <button
                className="btn"
                style={{ padding: '1rem 0.5rem', fontSize: '1.2rem', background: 'transparent', border: '0.15rem solid #ef4444', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                onClick={() => handleScoreChange(team.id, activeRound?.points_wrong || 0, `Jawaban salah di babak ${activeRound?.name}`)}
              >
                {/* Cross SVG */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <strong>{activeRound?.points_wrong || 0} Salah</strong>
              </button>
            </div>

            {/* Kustomisasi Skor Tambahan (Tersembunyi by Default) */}
            <details style={{ marginTop: '0.2rem' }}>
              <summary style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem 0', userSelect: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Opsi Poin Kustom
              </summary>
              <div style={{
                display: 'flex',
                gap: '0.8rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '0.8rem',
                padding: '1rem',
                alignItems: 'center',
                border: '0.1rem dashed rgba(255,255,255,0.1)',
                marginTop: '0.8rem',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', width: '100%' }}>Poin Kustom:</span>
                <input
                  type="number"
                  className="form-control"
                  value={customValue !== undefined ? customValue : 50}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomValue(val === '' ? '' : parseInt(val));
                  }}
                  style={{ flexGrow: 1, width: 'auto', minWidth: '6rem', padding: '0.6rem', fontSize: '1.2rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '0.1rem solid rgba(255,255,255,0.1)' }}
                />
                <button
                  className="btn"
                  style={{ flexGrow: 1, padding: '0.6rem 1rem', fontSize: '1.1rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '0.1rem solid rgba(52, 211, 153, 0.2)' }}
                  onClick={() => handleScoreChange(team.id, customValue || 0, `Penambahan manual kustom`)}
                >
                  + Tambah
                </button>
                <button
                  className="btn"
                  style={{ flexGrow: 1, padding: '0.6rem 1rem', fontSize: '1.1rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f87171', border: '0.1rem solid rgba(244, 63, 94, 0.2)' }}
                  onClick={() => handleScoreChange(team.id, -(customValue || 0), `Pengurangan manual kustom`)}
                >
                  - Kurang
                </button>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
