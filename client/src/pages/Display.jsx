import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

// Koneksi Socket.IO ke backend server
const socket = io('http://localhost:5000');

const AnimatedScore = ({ rawScore, displayScore, teamColor }) => {
  const [prevScore, setPrevScore] = useState(rawScore);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (rawScore > prevScore) {
      setAnimClass('score-increase');
      setPrevScore(rawScore);
      const timer = setTimeout(() => setAnimClass(''), 600);
      return () => clearTimeout(timer);
    } else if (rawScore < prevScore) {
      setAnimClass('score-decrease');
      setPrevScore(rawScore);
      const timer = setTimeout(() => setAnimClass(''), 500);
      return () => clearTimeout(timer);
    }
  }, [rawScore, prevScore]);

  // helper function to ensure rgba conversion if needed
  const hexToRgbaLocal = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className={`score-text ${animClass}`} style={{ 
      fontSize: 'clamp(8rem, 12vw, 14rem)', 
      fontWeight: 900, 
      color: '#ffffff',
      lineHeight: 1,
      marginTop: '4rem',
      marginBottom: 'auto',
      textAlign: 'center',
      textShadow: `0 0 5rem ${hexToRgbaLocal(teamColor, 0.7)}, 0 0 1.5rem ${hexToRgbaLocal(teamColor, 0.9)}`,
      fontFamily: "'Outfit', sans-serif",
      display: 'inline-block'
    }}>
      {displayScore}
    </div>
  );
};

export default function Display() {
  // === STATE ===
  const [eventInfo, setEventInfo] = useState({ name: 'Smart Lomba', date: '', description: '' });
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [buzzerWinner, setBuzzerWinner] = useState(null);
  const [showBuzzerOverlay, setShowBuzzerOverlay] = useState(false);
  const [gameState, setGameState] = useState({
    activeRoundId: 1, timerValue: 0, timerMax: 30, timerStatus: 'stopped',
    timerType: 'countdown', activeBuzzerTeam: null, isBuzzerLocked: false,
    revealScores: true, tebakKataPlayer: 1, tebakKataMaxPlayers: 6,
    showTimerFullScreen: false
  });

  // Animasi FLIP Refs
  const refs = useRef({});
  const positions = useRef({});

  useLayoutEffect(() => {
    teams.forEach((t) => {
      const el = refs.current[t.id];
      if (el) positions.current[t.id] = el.getBoundingClientRect();
    });
  });

  useLayoutEffect(() => {
    teams.forEach((t) => {
      const el = refs.current[t.id];
      const first = positions.current[t.id];
      if (el && first) {
        const last = el.getBoundingClientRect();
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        if (deltaX !== 0 || deltaY !== 0) {
          el.style.transition = 'none';
          el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease';
            el.style.transform = '';
          });
        }
      }
    });
  }, [gameState.revealScores, teams]);

  // === SOCKET & DATA FETCH ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, tmRes, rdRes] = await Promise.all([
          fetch('http://localhost:5000/api/event'),
          fetch('http://localhost:5000/api/teams'),
          fetch('http://localhost:5000/api/rounds')
        ]);
        setEventInfo(await evRes.json());
        setTeams(await tmRes.json());
        setRounds(await rdRes.json());
      } catch (e) {
        console.error('Fetch error:', e);
      }
    };
    fetchData();

    socket.on('game-state', (s) => {
      setGameState(s);
      if (s.activeBuzzerTeam) {
        setBuzzerWinner(s.activeBuzzerTeam);
        setShowBuzzerOverlay(true);
      } else {
        setShowBuzzerOverlay(false);
      }
    });

    socket.on('timer-tick', (v) => setGameState(p => ({ ...p, timerValue: v })));
    socket.on('teams-updated', (t) => setTeams(t));
    socket.on('event-updated', (e) => setEventInfo(e));
    socket.on('buzzer-ready', () => { setBuzzerWinner(null); setShowBuzzerOverlay(false); });
    socket.on('buzzer-triggered', (name) => {
      setBuzzerWinner(name);
      setShowBuzzerOverlay(true);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (e) {}
    });

    return () => ['game-state','timer-tick','teams-updated','event-updated','buzzer-ready','buzzer-triggered'].forEach(e => socket.off(e));
  }, []);

  useEffect(() => {
    if (rounds.length > 0) {
      setActiveRound(rounds.find(r => r.id === gameState.activeRoundId) || rounds[0]);
    }
  }, [gameState.activeRoundId, rounds]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'f' || e.key === 'F') toggleFullscreen(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fungsi pembantu untuk mengambil skor tim di babak aktif
  const getActiveRoundScore = (team) => {
    if (team.roundScores && gameState.activeRoundId) {
      return team.roundScores[gameState.activeRoundId] || 0;
    }
    return team.score || 0; // Fallback ke total skor jika data per babak belum siap
  };

  // Urutkan: skor DESC (revealed) atau abjad ASC (hidden)
  const sortedTeams = [...teams].sort((a, b) => gameState.revealScores ? getActiveRoundScore(b) - getActiveRoundScore(a) : a.name.localeCompare(b.name));

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const showTimerFS = !!gameState.showTimerFullScreen;

  // Format timer dinamis (jika di bawah 60 detik, hilangkan 00:)
  const formatTimer = (seconds) => {
    if (seconds < 60) {
      return seconds.toString();
    }
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div onDoubleClick={toggleFullscreen} style={{
      backgroundColor: '#0a0b10', // Dark navy cyber background
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 0.1rem, transparent 0.1rem), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 0.1rem, transparent 0.1rem)`,
      backgroundSize: '4rem 4rem',
      minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
      padding: 'clamp(2rem, 4vh, 4rem) clamp(3rem, 5vw, 6rem)',
      color: '#ffffff', fontFamily: "'Outfit', sans-serif", overflow: 'hidden',
      position: 'relative', userSelect: 'none', cursor: 'none',
      border: '0.2rem solid #2b3b6a', // Border luar mirip screenshot
      boxSizing: 'border-box'
    }}>

      <style>{`
        @keyframes scorePopUp {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.5) drop-shadow(0 0 4rem #4ade80); color: #4ade80; }
          100% { transform: scale(1); filter: brightness(1); color: #ffffff; }
        }
        @keyframes scoreShakeDown {
          0% { transform: translateX(0); filter: brightness(1); }
          20% { transform: translateX(-1rem); filter: brightness(1.2) drop-shadow(0 0 3rem #f43f5e); color: #f43f5e; }
          40% { transform: translateX(1rem); color: #f43f5e; }
          60% { transform: translateX(-0.5rem); color: #f43f5e; }
          80% { transform: translateX(0.5rem); color: #f43f5e; }
          100% { transform: translateX(0); filter: brightness(1); color: #ffffff; }
        }
        @keyframes heartbeatDanger {
          0% { transform: scale(1); color: #f43f5e; text-shadow: 0 0 5rem rgba(244,63,94,0.5); }
          15% { transform: scale(1.1); color: #ff0000; text-shadow: 0 0 15rem rgba(255,0,0,1); }
          30% { transform: scale(1); color: #f43f5e; text-shadow: 0 0 5rem rgba(244,63,94,0.5); }
          45% { transform: scale(1.1); color: #ff0000; text-shadow: 0 0 15rem rgba(255,0,0,1); }
          100% { transform: scale(1); color: #f43f5e; text-shadow: 0 0 5rem rgba(244,63,94,0.5); }
        }
        .score-increase {
          animation: scorePopUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .score-decrease {
          animation: scoreShakeDown 0.5s ease-in-out;
        }
        .timer-danger {
          animation: heartbeatDanger 1s infinite;
        }
      `}</style>

      {/* Konten Utama Layar Display (Akan disembunyikan jika Timer Layar Penuh Aktif) */}
      <div style={{
        flexGrow: 1, display: 'flex', flexDirection: 'column',
        opacity: showTimerFS ? 0 : 1, pointerEvents: showTimerFS ? 'none' : 'auto',
        transform: showTimerFS ? 'scale(0.92)' : 'scale(1)', transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
      }}>

        {/* HEADER: PIL SHAPED BANNER */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.1rem solid rgba(255,255,255,0.05)',
            borderRadius: '10rem',
            padding: '1rem 3rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2rem',
            boxShadow: '0 0.5rem 2rem rgba(0,0,0,0.2)'
          }}>
            <span style={{ fontSize: 'clamp(2rem, 2.5vw, 3rem)', fontWeight: 900, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 0.2rem 0.5rem rgba(0,0,0,0.5)' }}>
              {eventInfo.name}
            </span>
            <div style={{ width: '0.3rem', height: '3rem', background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 'clamp(1.8rem, 2vw, 2.5rem)', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.15em', textShadow: '0 0.2rem 0.5rem rgba(0,0,0,0.5)' }}>
              {activeRound ? activeRound.name : 'Persiapan'}
            </span>
          </div>
        </div>



        {/* SCORE GRID (FLAT) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4rem',
          flexGrow: 1,
          alignContent: 'center',
          maxWidth: '100%',
          margin: '0 auto',
          width: '100%'
        }}>
          {sortedTeams.map((team, idx) => {
            const isBuzzerActive = buzzerWinner === team.name;
            const teamColor = team.color || '#6366f1';
            const roundScore = getActiveRoundScore(team);
            const displayScore = gameState.revealScores ? roundScore.toLocaleString() : '---';

            return (
              <div 
                key={team.id} 
                ref={el => refs.current[team.id] = el}
                style={{
                  background: 'linear-gradient(145deg, rgba(34, 43, 69, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  borderRadius: '2.5rem',
                  padding: '5rem 6rem',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '34rem',
                  boxShadow: isBuzzerActive 
                    ? `0 0 8rem ${hexToRgba(teamColor, 0.8)}, inset 0 0 4rem ${hexToRgba(teamColor, 0.5)}` 
                    : `0 2.5rem 5rem rgba(0,0,0,0.6), inset 0 0.2rem 0.2rem rgba(255,255,255,0.15), inset 0 -1rem 3rem rgba(0,0,0,0.5), 0 0 4rem ${hexToRgba(teamColor, 0.15)}`,
                  transform: isBuzzerActive ? 'scale(1.05)' : 'translateY(-0.5rem)',
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
                  border: `0.2rem solid ${isBuzzerActive ? teamColor : hexToRgba(teamColor, 0.25)}`
                }}
              >

                {/* Header Kartu: Nama Tim */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', textAlign: 'center', marginBottom: 'auto' }}>
                  <div>
                    <div style={{ 
                      fontSize: 'clamp(3rem, 4vw, 4.5rem)', 
                      fontWeight: 900, 
                      color: '#ffffff', 
                      letterSpacing: '0.05em', 
                      textTransform: 'uppercase',
                      transform: 'skewX(-4deg)',
                      textShadow: '-0.08rem 0.08rem 0 #0ea5e9, 0.08rem -0.08rem 0 #f97316, 0 0.4rem 0.8rem rgba(0,0,0,0.8)'
                    }}>
                      {team.name}
                    </div>
                  </div>
                </div>

                {/* Nilai Skor Raksasa Dinamis */}
                <AnimatedScore rawScore={roundScore} displayScore={displayScore} teamColor={teamColor} />

              </div>
            );
          })}
        </div>
      </div>


      {/* === LAYAR TIMER FULLSCREEN / CEPAT TEPAT === */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0a0b10',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingBottom: '8vh', // Menggeser keseluruhan blok sedikit ke atas
        opacity: showTimerFS ? 1 : 0, pointerEvents: showTimerFS ? 'auto' : 'none',
        transition: 'opacity 0.7s ease', zIndex: showTimerFS ? 100 : -1
      }}>
        {(() => {
          const activeTKTeam = teams.find(t => t.id === gameState.tebakKataActiveTeamId);
          const isDanger = gameState.timerValue > 0 && gameState.timerValue <= 5;
          const timerColor = isDanger ? '#f43f5e' : '#ffffff';
          const shadowColor = activeTKTeam ? hexToRgba(activeTKTeam.color, isDanger ? 0.9 : 0.6) : 'rgba(99,102,241,0.6)';

          return (
            <>
              <div style={{ 
                fontSize: 'clamp(4rem, 5vw, 6rem)', 
                color: activeTKTeam ? activeTKTeam.color : '#ffffff', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em', 
                fontWeight: 900, 
                marginBottom: '5rem',
                textShadow: `0 0.5rem 2rem ${activeTKTeam ? hexToRgba(activeTKTeam.color, 0.5) : 'transparent'}`
              }}>
                {activeTKTeam ? activeTKTeam.name : 'MODE CEPAT TEPAT'}
              </div>
              <div 
                className={isDanger ? 'timer-danger' : ''}
                style={{ 
                  fontSize: 'clamp(35rem, 55vw, 65rem)', 
                  fontWeight: 900, 
                  lineHeight: 1, 
                  color: timerColor, 
                  textShadow: `0 0 15rem ${shadowColor}`, 
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.3s ease'
                }}
              >
                {formatTimer(gameState.timerValue)}
              </div>
            </>
          );
        })()}
      </div>

    </div>
  );
}
