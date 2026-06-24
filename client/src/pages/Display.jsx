import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import logoUrl from '../../images/kediri-technopark-logo.png';

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
        const [tmRes, rdRes] = await Promise.all([
          fetch('http://localhost:5000/api/teams'),
          fetch('http://localhost:5000/api/rounds')
        ]);
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

    return () => ['game-state','timer-tick','teams-updated','buzzer-ready','buzzer-triggered'].forEach(e => socket.off(e));
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

  // Posisi tim dibuat paten (tidak berubah-ubah) berdasarkan urutan pembuatan (ID)
  const sortedTeams = [...teams].sort((a, b) => a.id - b.id);

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const showTimerFS = !!gameState.showTimerFullScreen;
  const showRankingFS = !!gameState.showRankingFullScreen;
  const isMainHidden = showTimerFS || showRankingFS;

  // Format timer dinamis: Selalu tampilkan dalam format detik murni (misal: 60, 90, dst)
  const formatTimer = (seconds) => {
    return seconds.toString();
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
        @keyframes dramaticReveal {
          0% { transform: scale(0.5) translateY(20rem); opacity: 0; filter: blur(2rem); }
          60% { transform: scale(1.1) translateY(-2rem); opacity: 1; filter: brightness(2) blur(0); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: brightness(1); }
        }
        @keyframes crownGlow {
          0% { filter: drop-shadow(0 0 1rem #fbbf24); transform: translateY(0); }
          50% { filter: drop-shadow(0 0 4rem #fbbf24) brightness(1.5); transform: translateY(-1rem); }
          100% { filter: drop-shadow(0 0 1rem #fbbf24); transform: translateY(0); }
        }
      `}</style>

      {/* Konten Utama Layar Display (Akan disembunyikan jika Timer / Ranking Layar Penuh Aktif) */}
      <div style={{
        flexGrow: 1, display: 'flex', flexDirection: 'column',
        opacity: isMainHidden ? 0 : 1, pointerEvents: isMainHidden ? 'none' : 'auto',
        transform: isMainHidden ? 'scale(0.92)' : 'scale(1)', transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
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
              HUT RI KE-81
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
          width: '100%',
          paddingBottom: '8rem'
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
                {activeTKTeam ? activeTKTeam.name : 'TIMER TEBAK KATA'}
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

              {/* Mini Scoreboard Cards di Bawah Timer */}
              <div style={{
                position: 'absolute',
                bottom: '4rem',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                padding: '0 4rem',
                width: '100%'
              }}>
                {sortedTeams.map((team) => {
                  const roundScore = getActiveRoundScore(team);
                  const isActive = activeTKTeam && activeTKTeam.id === team.id;
                  
                  return (
                    <div key={team.id} style={{
                      flex: 1,
                      maxWidth: '22rem',
                      background: isActive 
                        ? `linear-gradient(145deg, ${hexToRgba(team.color, 0.3)} 0%, ${hexToRgba(team.color, 0.1)} 100%)`
                        : `linear-gradient(145deg, rgba(34, 43, 69, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)`,
                      border: `0.2rem solid ${isActive ? team.color : hexToRgba(team.color, 0.3)}`,
                      borderTop: `0.6rem solid ${team.color}`,
                      borderRadius: '1.5rem',
                      padding: '1.5rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: isActive 
                        ? `0 0 3rem ${hexToRgba(team.color, 0.4)}, inset 0 0 2rem ${hexToRgba(team.color, 0.2)}`
                        : `0 1rem 2rem rgba(0,0,0,0.5)`,
                      transform: isActive ? 'translateY(-1rem) scale(1.05)' : 'translateY(0) scale(1)',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                      <span style={{ 
                        fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', 
                        textTransform: 'uppercase', letterSpacing: '0.05em', 
                        textAlign: 'center', marginBottom: '1rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'
                      }}>
                        {team.name}
                      </span>
                      <span style={{ 
                        fontSize: '4.5rem', fontWeight: 900, color: isActive ? '#ffffff' : team.color, 
                        textShadow: isActive ? `0 0 2rem ${hexToRgba(team.color, 0.8)}, 0 0 4rem ${team.color}` : 'none', 
                        lineHeight: 1, fontFamily: 'var(--font-outfit)'
                      }}>
                        {gameState.revealScores ? roundScore.toLocaleString() : '---'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* === LAYAR PENGUMUMAN JUARA (KLASEMEN AKHIR) DENGAN ANIMASI DRAMATIS === */}
      {showRankingFS && (
        <>
        <style>{`
          @keyframes dramaticRise {
            0% { transform: translateY(100vh) scale(0.9); opacity: 0; filter: brightness(0); }
            60% { transform: translateY(-3rem) scale(1.02); opacity: 1; filter: brightness(1.5); }
            80% { transform: translateY(1rem) scale(0.98); filter: brightness(1.2); opacity: 1; }
            100% { transform: translateY(0) scale(1); filter: brightness(1); opacity: 1; }
          }
          @keyframes fireGlow {
            0%, 100% { box-shadow: 0 -1rem 4rem rgba(251, 146, 60, 0.4), inset 0 2rem 5rem rgba(251, 146, 60, 0.2); }
            50% { box-shadow: 0 -3rem 8rem rgba(249, 115, 22, 0.8), inset 0 5rem 8rem rgba(249, 115, 22, 0.5); }
          }
          @keyframes crownFloat {
            0%, 100% { transform: translateY(0) rotate(-5deg) scale(1); filter: drop-shadow(0 0 2rem rgba(251, 191, 36, 0.8)); opacity: 1; }
            50% { transform: translateY(-2rem) rotate(5deg) scale(1.15); filter: drop-shadow(0 0 5rem rgba(251, 191, 36, 1)); opacity: 1; }
          }
        `}</style>
        <div 
          key={gameState.rankingAnimationKey || 'ranking'}
          style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            background: 'radial-gradient(circle at top, #1e1b4b 0%, #0f172a 60%, #000000 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
            overflow: 'hidden'
          }}>
          {(() => {
            // Urutkan tim berdasarkan Skor Total untuk Klasemen Akhir
            const rankingTeams = [...teams].sort((a, b) => b.score - a.score);
            
            // Susun array agar Juara 1 di tengah, 2 di kiri, 3 di kanan, dst.
            const podiumOrder = [];
            rankingTeams.forEach((team, index) => {
              if (index % 2 === 1) {
                podiumOrder.unshift({ team, rank: index + 1 });
              } else {
                podiumOrder.push({ team, rank: index + 1 });
              }
            });

            return (
              <>
                <h1 style={{ 
                  position: 'absolute', top: '5rem',
                  fontSize: 'clamp(5rem, 6vw, 7.5rem)', color: '#ffffff', textTransform: 'uppercase', 
                  letterSpacing: '0.15em', textShadow: '0 1rem 3rem rgba(0,0,0,0.8), 0 0 2rem rgba(251,191,36,0.3)',
                  opacity: 0, fontFamily: 'var(--font-outfit)', fontWeight: 900,
                  animation: 'dramaticReveal 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                }}>
                  KLASEMEN <span style={{ color: '#fbbf24', textShadow: '0 0 3rem rgba(251,191,36,0.6)' }}>{gameState.rankingTitle || 'AKHIR'}</span>
                </h1>
                
                <div style={{ 
                  display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.5rem', width: '100%', maxWidth: '160rem', height: '75vh' 
                }}>
                  {podiumOrder.map(({ team, rank }, index) => {
                    const isWinner = rank === 1;
                    // Delay Animasi: Peringkat bawah muncul duluan
                    const delay = (rankingTeams.length - rank) * 1.5; 
                    
                    // Jarak tinggi dinamis yang diatur manual agar gap juara 1 dan 2 sangat terlihat
                    const heightPercentages = [100, 72, 58, 46, 36, 28];
                    const heightPercent = heightPercentages[rank - 1] || 25;

                    return (
                      <div key={team.id} style={{
                        flex: isWinner ? 1.5 : 1, // Juara 1 lebih lebar
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        height: `${heightPercent}%`,
                        opacity: 0, 
                        animation: `dramaticRise 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                        animationDelay: `${delay}s`,
                        zIndex: isWinner ? 10 : 5,
                        position: 'relative'
                      }}>
                        
                        {isWinner && (
                          <div style={{ 
                            marginBottom: '2rem', 
                            animation: `crownFloat 3s ease-in-out infinite`, animationDelay: `${delay + 1.5}s`,
                            color: '#fbbf24', opacity: 0,
                            animationFillMode: 'forwards'
                          }}>
                            {/* Mahkota SVG Keren */}
                            <svg width="72" height="72" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 2rem rgba(251,191,36,0.8))' }}>
                              <polygon points="2 22 22 22 20 8 16 14 12 4 8 14 4 8 2 22" />
                            </svg>
                          </div>
                        )}

                        {/* Kartu Bar Podium */}
                        <div style={{
                          background: isWinner 
                            ? `linear-gradient(to top, ${hexToRgba(team.color, 0.9)} 0%, ${hexToRgba('#fbbf24', 0.5)} 50%, rgba(255,255,255,0.3) 100%)` 
                            : `linear-gradient(to top, ${hexToRgba(team.color, 0.8)} 0%, ${hexToRgba(team.color, 0.15)} 100%)`,
                          borderTop: isWinner ? `0.4rem solid #fbbf24` : `0.3rem solid ${team.color}`,
                          borderLeft: `0.1rem solid ${hexToRgba(team.color, 0.4)}`,
                          borderRight: `0.1rem solid ${hexToRgba(team.color, 0.4)}`,
                          width: '100%',
                          height: '100%',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                          padding: isWinner ? '3rem 1rem' : '2rem 1rem', 
                          borderRadius: '1.5rem 1.5rem 0 0',
                          boxShadow: isWinner ? 'none' : `0 -1rem 4rem ${hexToRgba(team.color, 0.3)}, inset 0 2rem 4rem ${hexToRgba(team.color, 0.1)}`,
                          animation: isWinner ? `fireGlow 2s infinite ease-in-out` : 'none',
                          animationDelay: `${delay + 1.5}s`, // Mulai membara setelah muncul
                          position: 'relative', overflow: 'hidden'
                        }}>
                          {/* Angka Ranking Halus di Latar */}
                          <div style={{
                            position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
                            fontSize: '20rem', fontWeight: 900, color: 'rgba(255,255,255,0.03)',
                            lineHeight: 0.8, pointerEvents: 'none', zIndex: 0
                          }}>
                            {rank}
                          </div>

                          <span style={{ 
                            fontSize: isWinner ? '2.4rem' : '1.8rem', 
                            fontWeight: 600, color: '#94a3b8', 
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            zIndex: 1
                          }}>
                            Juara {rank}
                          </span>
                          <span style={{ 
                            fontSize: isWinner ? '3.6rem' : '2.4rem', 
                            fontWeight: 800, color: '#ffffff', 
                            marginTop: '1rem', textTransform: 'uppercase', 
                            letterSpacing: '0.05em', textAlign: 'center',
                            textShadow: '0 0.5rem 1rem rgba(0,0,0,0.5)', zIndex: 1
                          }}>
                            {team.name}
                          </span>
                          
                          {/* Nilai Poin di Bawah */}
                          <div style={{
                            marginTop: 'auto', marginBottom: '2rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            zIndex: 1
                          }}>
                            <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Poin Akhir</span>
                            <span style={{ 
                              fontSize: isWinner ? '5rem' : '3.6rem', 
                              fontWeight: 900, color: isWinner ? '#fbbf24' : '#ffffff', 
                              textShadow: `0 0 2rem ${isWinner ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.4)'}`, 
                              fontFamily: 'var(--font-outfit)', lineHeight: 1, marginTop: '0.5rem'
                            }}>
                              {team.score.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
        </>
      )}

      {/* Powered By Logo - Visible in all modes */}
      <div style={{
        position: 'absolute',
        bottom: showRankingFS ? 'auto' : '2rem',
        top: showRankingFS ? '2rem' : 'auto',
        left: showRankingFS ? 'auto' : '50%',
        right: showRankingFS ? '3rem' : 'auto',
        transform: showRankingFS ? 'none' : 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 10000,
        opacity: 0.85,
        pointerEvents: 'none',
        transition: 'all 0.5s ease-in-out'
      }}>
        {!showRankingFS && (
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
        )}
        <img 
          src={logoUrl} 
          alt="Kediri Technopark Logo" 
          style={{
            height: showRankingFS ? '4rem' : '6.5rem',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0.2rem 0.5rem rgba(0,0,0,0.5))',
            transition: 'height 0.5s ease-in-out'
          }}
        />
      </div>

    </div>
  );
}
