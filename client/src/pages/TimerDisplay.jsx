import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import logoUrl from '../../images/kediri-technopark-logo.png';

// Koneksi Socket.IO ke backend server
const socket = io('http://localhost:5000');

/**
 * Komponen: TimerDisplay
 * Tujuan: Menyajikan tampilan timer layar penuh khusus proyektor
 * dilengkapi floating navigation agar mudah berpindah halaman dalam satu tab.
 */
export default function TimerDisplay() {
  // === STATE ===
  // State real-time timer dari server
  const [gameState, setGameState] = useState({
    timerValue: 0, timerMax: 30, timerStatus: 'stopped',
    timerType: 'countdown'
  });
  // Babak aktif saat ini
  const [activeRound, setActiveRound] = useState(null);

  // === EFFECTS & SOCKETS ===
  useEffect(() => {
    // Fungsi mengambil daftar babak kuis
    const fetchRounds = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/rounds');
        const data = await res.json();
        // Set default babak pertama
        if (data.length > 0) setActiveRound(data[0]);
      } catch (e) { console.error('Fetch error:', e); }
    };
    fetchRounds(); // Jalankan fetch

    // Daftarkan listener Socket IO
    socket.on('game-state', (s) => setGameState(s));
    socket.on('timer-tick', (v) => setGameState(p => ({ ...p, timerValue: v })));
    
    // Bersihkan listener saat unmount
    return () => { socket.off('game-state'); socket.off('timer-tick'); };
  }, []);

  // Hitung persentase durasi timer berjalan
  const timerPercent = gameState.timerMax > 0 ? (gameState.timerValue / gameState.timerMax) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // radius 45 ring SVG
  const strokeDash = (timerPercent / 100) * circumference;
  
  // Perubahan warna dinamis timer (Hijau -> Amber -> Rose)
  const timerColor = gameState.timerValue <= 5 ? '#f43f5e' : gameState.timerValue <= 10 ? '#f59e0b' : '#10b981';

  /** Toggle mode layar penuh via Fullscreen API */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  // Keyboard listener 'F' untuk full screen
  useEffect(() => {
    const handler = (e) => { if (e.key === 'f' || e.key === 'F') toggleFullscreen(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div onDoubleClick={toggleFullscreen} style={{
      background: 'linear-gradient(170deg, #080c18 0%, #0c1220 35%, #101828 70%, #0f172a 100%)',
      minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#ffffff', fontFamily: "'Outfit', sans-serif", overflow: 'hidden',
      position: 'relative', userSelect: 'none'
    }}>
      
      {/* === PICU NAVIGASI MELAYANG (HOVER TRIGGER) === */}
      <div 
        style={{ position: 'fixed', top: 0, left: '2rem', width: '32rem', height: '2rem', zIndex: 9998, background: 'transparent' }}
        onMouseEnter={() => {
          const nav = document.getElementById('floating-nav-container');
          if (nav) { nav.style.opacity = '1'; nav.style.transform = 'translateY(0)'; nav.style.pointerEvents = 'auto'; }
        }}
      />

      {/* === MENU NAVIGASI MELAYANG === */}
      <div 
        id="floating-nav-container"
        style={{
          position: 'fixed', top: 0, left: '2rem', zIndex: 9999, paddingTop: '1.5rem',
          opacity: 0, transform: 'translateY(-1rem)', transition: 'all 0.3s ease', pointerEvents: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.pointerEvents = 'auto';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0'; e.currentTarget.style.transform = 'translateY(-1rem)'; e.currentTarget.style.pointerEvents = 'none';
        }}
      >
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)', border: '0.1rem solid rgba(255, 255, 255, 0.08)',
          borderRadius: '1rem', padding: '0.8rem 1.5rem', display: 'flex', gap: '1rem', boxShadow: '0 1rem 3rem rgba(0, 0, 0, 0.5)'
        }}>
          <Link to="/operator" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.5rem 1rem' }}>Layar Operator</Link>
          <Link to="/display" style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f43f5e', padding: '0.5rem 1rem' }}>Layar Skor</Link>
        </div>
      </div>

      {/* Nama Babak */}
      {activeRound && (
        <div style={{
          position: 'absolute', top: 'clamp(2rem, 4vh, 4rem)', left: '50%', transform: 'translateX(-50%)',
          fontSize: 'clamp(1.2rem, 1.5vw, 1.6rem)', color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 600
        }}>
          {activeRound.name}
        </div>
      )}

      {/* Timer Ring Besar */}
      <div style={{ position: 'relative', width: 'clamp(30rem, 50vw, 50rem)', height: 'clamp(30rem, 50vw, 50rem)' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={timerColor} strokeWidth="2"
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDash}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontSize: 'clamp(10rem, 20vw, 18rem)', fontWeight: 800,
            color: timerColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 6rem ${timerColor}40`
          }}>
            {gameState.timerValue}
          </span>
          <span style={{
            fontSize: 'clamp(1.2rem, 1.5vw, 1.8rem)', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: '1rem'
          }}>Detik</span>
        </div>
      </div>

      {/* Status Timer */}
      <div style={{
        position: 'absolute', bottom: '10rem',
        fontSize: '1.2rem', color: 'rgba(255,255,255,0.15)',
        textTransform: 'uppercase', letterSpacing: '0.2em'
      }}>
        {gameState.timerStatus === 'running' ? 'Berjalan' : gameState.timerStatus === 'paused' ? 'Dijeda' : 'Berhenti'}
      </div>

      {/* Fullscreen button */}
      <button onClick={toggleFullscreen} style={{
        position: 'fixed', bottom: '2rem', right: '2rem', background: 'rgba(255,255,255,0.03)',
        border: '0.1rem solid rgba(255,255,255,0.05)', borderRadius: '50%', width: '3.5rem', height: '3.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        color: 'rgba(255,255,255,0.12)', transition: 'all 0.2s', zIndex: 1000
      }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
         onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.12)'; }}
         title="Tekan F atau klik ganda untuk fullscreen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>

      {/* Powered By Logo - Visible in Timer Display */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 10000,
        opacity: 0.85,
        pointerEvents: 'none'
      }}>
        <span style={{
          fontSize: '1.4rem',
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontWeight: 600,
          fontFamily: "'Outfit', sans-serif"
        }}>
          Powered by
        </span>
        <img 
          src={logoUrl} 
          alt="Kediri Technopark Logo" 
          style={{
            height: '6.5rem',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0.2rem 0.5rem rgba(0,0,0,0.5))'
          }}
        />
      </div>

    </div>
  );
}
