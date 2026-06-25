import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import logoUrl from '../../images/kediri-technopark-logo.png';

/**
 * Komponen: BrandingLogo
 * Deskripsi: Komponen independen untuk menampilkan logo Kediri Technopark di sudut kanan atas layar tanpa teks "Powered by".
 *            Dibuat terpisah agar tata letak logo terisolasi dan mudah dikelola secara modular.
 */
const BrandingLogo = () => {
  // Mengembalikan elemen visual logo dalam struktur DOM React
  return (
    // Kontainer penampung logo dengan penataan posisi absolut di sudut kanan atas layar
    <div style={{
      position: 'absolute', // Menghapus elemen dari alur dokumen normal agar bisa diposisikan secara bebas
      top: '2.5rem',          // Memberikan margin atas sebesar 2.5rem dari tepi layar agar tidak terlalu mepet
      right: '3.5rem',         // Memberikan margin kanan sebesar 3.5rem dari tepi layar untuk keseimbangan visual
      zIndex: 10000,        // Memastikan logo berada pada tumpukan teratas di atas kartu skor dan elemen overlay lainnya
      pointerEvents: 'none', // Mengabaikan interaksi kursor agar klik mouse menembus ke elemen di bawah logo
    }}>
      {/* Gambar logo Kediri Technopark */}
      <img 
        src={logoUrl} // Menghubungkan sumber gambar dengan berkas logo Kediri Technopark yang telah diimpor
        alt="Kediri Technopark Logo" // Menyediakan teks alternatif untuk kebutuhan aksesibilitas pembaca layar (screen reader)
        style={{
          height: '4.5rem', // Mengatur dimensi tinggi logo secara responsif menggunakan satuan rem
          objectFit: 'contain', // Menjaga perbandingan aspek (ratio) logo agar tidak mengalami distorsi/penyok
          filter: 'drop-shadow(0 0.2rem 0.5rem rgba(0,0,0,0.5))', // Memberikan bayangan lembut di belakang logo untuk keterbacaan yang optimal
        }}
      />
    </div>
  );
};

// ==========================================
// KUMPULAN LOGIKA AUDIO WEB AUDIO API (SYNTHESIZER)
// ==========================================

// Fungsi pembantu untuk memicu bunyi Chime saat poin tim bertambah (Nada C5 -> E5 -> G5)
const playScoreAddSound = () => {
  try {
    // Membuat instance AudioContext baru untuk rendering suara
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime; // Mengambil waktu sekarang dari konteks audio
    
    // Nada-nada yang membentuk chord major C (C5 = 523.25Hz, E5 = 659.25Hz, G5 = 783.99Hz)
    const notes = [523.25, 659.25, 783.99];
    
    notes.forEach((freq, idx) => {
      // Membuat oscillator generator gelombang
      const osc = ctx.createOscillator();
      // Mengatur tipe oscillator ke gelombang sinus agar berbunyi jernih lembut seperti lonceng
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08); // Penundaan sekuensial antar nada
      
      // Membuat pengatur volume gain node
      const gainNode = ctx.createGain();
      // Volume mulai dari 0, melesat ke 0.15, lalu meluruh habis
      gainNode.gain.setValueAtTime(0, now + idx * 0.08);
      gainNode.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      
      // Menghubungkan node oscillator -> gain -> speaker
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Memulai dan mengakhiri bunyi nada ke-n
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  } catch (e) {
    console.error('Gagal memainkan audio tambah skor:', e);
  }
};

// Fungsi pembantu untuk memicu bunyi Buzz saat poin tim berkurang (Nada gergaji merosot)
const playScoreSubSound = () => {
  try {
    // Membuat instance AudioContext baru
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime; // Waktu saat ini dari server audio browser
    
    const osc = ctx.createOscillator();
    // Menggunakan gelombang segitiga agar suara buzz terdengar tegas namun tidak kasar di telinga
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now); // Mulai dari nada A3 (220Hz)
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25); // Melorot ke 110Hz dalam 0.25 detik
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.2, now); // Set amplitudo gain awal
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Fade out pelan hingga sunyi
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now); // Mulai oscillator
    osc.stop(now + 0.3); // Hentikan setelah 0.3 detik
  } catch (e) {
    console.error('Gagal memainkan audio kurang skor:', e);
  }
};

// Fungsi pembantu untuk memicu bunyi beeps countdown timer (detik 5 kebawah & buzzer waktu habis)
const playTimerCountdownSound = (isTimeout) => {
  try {
    // Membuat instance AudioContext baru
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    if (isTimeout) {
      // Buzzer waktu habis: nada rendah gergaji yang kuat selama 0.7 detik
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.7);
      
      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    } else {
      // Countdown detik 5 ke bawah: beep tinggi pendek 800Hz selama 0.08 detik
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      
      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    console.error('Gagal memainkan audio timer:', e);
  }
};

// Fungsi pembantu untuk memicu bunyi pad/whoosh sinematik saat layar klasemen dipanggil
const playStandingsWhooshSound = () => {
  try {
    // Membuat instance AudioContext baru
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    
    // Jalur 1: Sub Bass Sweep (memberikan getaran berat dramatis)
    const oscSub = ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(70, now);
    oscSub.frequency.exponentialRampToValueAtTime(160, now + 1.2);
    
    const gainSub = ctx.createGain();
    gainSub.gain.setValueAtTime(0, now);
    gainSub.gain.linearRampToValueAtTime(0.3, now + 0.3);
    gainSub.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    oscSub.connect(gainSub);
    gainSub.connect(ctx.destination);
    oscSub.start(now);
    oscSub.stop(now + 1.2);
    
    // Jalur 2: Synth Chord Swell (nada harmoni menyapu lembut)
    const freqs = [220, 277.18, 329.63, 440]; // Chord A Major (A3, C#4, E4, A4)
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 1.5); // Efek bend frekuensi ke atas
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.4); // Fade in lambat (swell)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Fade out pelan
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.6);
    });
  } catch (e) {
    console.error('Gagal memainkan audio panggung klasemen:', e);
  }
};

// Koneksi Socket.IO ke backend server
const socket = io('http://localhost:5000');

const AnimatedScore = ({ rawScore, displayScore, teamColor }) => {
  const [prevScore, setPrevScore] = useState(rawScore);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (rawScore > prevScore) {
      setAnimClass('score-increase');
      setPrevScore(rawScore);
      playScoreAddSound(); // Memainkan bunyi chime naik saat nilai skor tim bertambah
      const timer = setTimeout(() => setAnimClass(''), 600);
      return () => clearTimeout(timer);
    } else if (rawScore < prevScore) {
      setAnimClass('score-decrease');
      setPrevScore(rawScore);
      playScoreSubSound(); // Memainkan bunyi buzz turun ketika skor tim dikurangi
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

  // Refs untuk mencatat nilai timer dan tampilan klasemen sebelumnya demi membatasi pemicu bunyi ganda
  const lastTimerValueRef = useRef(gameState.timerValue); // Ref penyimpan nilai detik timer sebelumnya
  const lastTimerStatusRef = useRef(gameState.timerStatus); // Ref penyimpan status timer sebelumnya
  const lastShowRankingRef = useRef(!!gameState.showRankingFullScreen); // Ref penyimpan status tampilan klasemen layar penuh sebelumnya

  // Efek samping untuk memantau perubahan waktu timer detik demi detik
  useEffect(() => {
    const prevVal = lastTimerValueRef.current; // Membaca nilai detik detik sebelumnya
    const prevStatus = lastTimerStatusRef.current; // Membaca status timer sebelumnya
    
    lastTimerValueRef.current = gameState.timerValue; // Memperbarui ref dengan nilai detik baru
    lastTimerStatusRef.current = gameState.timerStatus; // Memperbarui ref dengan status timer baru
    
    // Bunyi timer beeps countdown: hanya aktif ketika timer dalam status berjalan dan angkanya berkurang
    if (gameState.timerStatus === 'running' && gameState.timerValue < prevVal) {
      if (gameState.timerValue >= 1 && gameState.timerValue <= 5) {
        playTimerCountdownSound(false); // Membunyikan suara beep pendek untuk countdown detik 5 ke bawah
      } else if (gameState.timerValue === 0 && prevVal > 0) {
        playTimerCountdownSound(true); // Membunyikan suara buzzer panjang saat waktu timer menyentuh 0 (habis)
      }
    }
  }, [gameState.timerValue, gameState.timerStatus]);

  // Efek samping untuk mendeteksi kemunculan overlay papan peringkat / klasemen
  useEffect(() => {
    const prevShow = lastShowRankingRef.current; // Membaca status tampilan klasemen sebelumnya
    const currentShow = !!gameState.showRankingFullScreen; // Menentukan status tampilan saat ini
    lastShowRankingRef.current = currentShow; // Memperbarui ref dengan status tampilan baru
    
    // Bunyi visualisasi masuk: mainkan sound swell dramatis saat klasemen dipanggil ke layar penuh
    if (currentShow && !prevShow) {
      playStandingsWhooshSound(); // Membunyikan musik pad swells sinematik di speaker proyektor
    }
  }, [gameState.showRankingFullScreen]);

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
      {/* === LAYAR PENGUMUMAN JUARA (KLASEMEN AKHIR) DENGAN ANIMASI DRAMATIS === */}
      {showRankingFS && (
        <>
        {/* Deklarasi CSS Keyframe secara lokal khusus untuk animasi panggung klasemen akhir */}
        <style>{`
          /* Animasi masuk naik elastis dari bawah dengan efek blur dan pencahayaan */
          @keyframes dramaticRise {
            0% { transform: translateY(120vh) scale(0.85); opacity: 0; filter: blur(1.5rem) brightness(0); }
            65% { transform: translateY(-2.5rem) scale(1.03); opacity: 1; filter: blur(0) brightness(1.5); }
            85% { transform: translateY(1rem) scale(0.98); filter: brightness(1.1); }
            100% { transform: translateY(0) scale(1); opacity: 1; filter: brightness(1); }
          }
          /* Animasi denyut cahaya emas mewah (luxury gold) di sekeliling podium juara pertama */
          @keyframes championGlow {
            0%, 100% { box-shadow: 0 0 3rem rgba(251, 191, 36, 0.2), inset 0 0 1.5rem rgba(251, 191, 36, 0.05); border-color: #fbbf24; }
            50% { box-shadow: 0 0 5rem rgba(251, 191, 36, 0.45), inset 0 0 2.5rem rgba(251, 191, 36, 0.15); border-color: #ffe066; }
          }
          /* Animasi masuk mahkota secara dramatis dengan pembesaran elastis */
          @keyframes fadeInCrown {
            0% { opacity: 0; transform: translateY(-8rem) scale(0.3) rotate(-15deg); filter: drop-shadow(0 0 0 transparent); }
            70% { transform: translateY(1.5rem) scale(1.2) rotate(5deg); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotate(-5deg); filter: drop-shadow(0 0 2rem rgba(251, 191, 36, 0.8)); }
          }
          /* Animasi melayang melingkar lembut untuk mahkota setelah mendarat */
          @keyframes crownFloat {
            0%, 100% { transform: translateY(0) rotate(-5deg) scale(1); filter: drop-shadow(0 0 2rem rgba(251, 191, 36, 0.8)); }
            50% { transform: translateY(-1.5rem) rotate(5deg) scale(1.1); filter: drop-shadow(0 0 4.5rem rgba(251, 191, 36, 1)); }
          }
          /* Efek kilatan cahaya diagonal (shimmer) menyapu permukaan kartu podium secara berkala */
          @keyframes shimmerSweep {
            0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
            15% { opacity: 0.65; }
            35% { opacity: 0; }
            100% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
          }
          /* Denyut cahaya latar belakang panggung (ambient) */
          @keyframes spotlightPulse {
            0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.95; transform: translateX(-50%) scale(1.08); }
          }
          /* Memudarkan sorotan cahaya berwarna tim di belakang podium */
          @keyframes fadeInSpotlight {
            0% { opacity: 0; transform: translateX(-50%) scale(0.6) translateY(5rem); }
            100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
          }
          /* Animasi teks sinematik melebar dan memudar masuk untuk judul */
          @keyframes trackingExpand {
            0% { letter-spacing: -0.5em; opacity: 0; filter: blur(2rem); }
            60% { opacity: 0.8; filter: blur(0.5rem); }
            100% { letter-spacing: 0.15em; opacity: 1; filter: blur(0); }
          }
        `}</style>
        {/* Container overlay klasemen penuh dengan latar belakang radial gelap */}
        <div 
          key={gameState.rankingAnimationKey || 'ranking'}
          style={{ 
            position: 'absolute', // Menentukan posisi absolut di seluruh area layar display
            top: 0, // Mengunci tepi atas ke 0
            left: 0, // Mengunci tepi kiri ke 0
            right: 0, // Mengunci tepi kanan ke 0
            bottom: 0, // Mengunci tepi bawah ke 0
            zIndex: 9999, // Memastikan kontainer berada di atas seluruh elemen halaman display utama
            background: 'radial-gradient(circle at top, #16153b 0%, #0a0b10 60%, #020204 100%)', // Latar belakang radial gradasi gelap bertema panggung
            display: 'flex', // Mengaktifkan tata letak flexbox untuk memposisikan anak elemen secara fleksibel
            flexDirection: 'column', // Mengatur arah flexbox secara vertikal (kolom)
            justifyContent: 'flex-end', // Memposisikan konten di bagian bawah agar podium menempel di dasar layar
            alignItems: 'center', // Menyelaraskan seluruh elemen anak di tengah secara horizontal
            overflow: 'hidden' // Menyembunyikan elemen meluap untuk kelancaran animasi masuk dari luar layar
          }}>
          
          {/* Sorotan Cahaya Ambient (Spotlight) Panggung Utama di Latar Belakang */}
          <div style={{
            position: 'absolute', // Posisi absolut di latar belakang
            bottom: 0, // Menempel pada batas bawah layar
            left: '50%', // Posisikan di tengah horizontal
            transform: 'translateX(-50%)', // Pusatkan jangkar titik tengah
            width: '140vw', // Mengatur lebar sorotan melebihi layar proyektor
            height: '75vh', // Mengatur tinggi sorotan setengah lebih tinggi dari viewport
            background: 'radial-gradient(ellipse at bottom, rgba(99,102,241,0.12) 0%, rgba(15,23,42,0) 70%)', // Gradasi elips warna indigo lembut yang memudar ke transparan
            filter: 'blur(6rem)', // Memberikan efek blur ekstra lembut untuk menghasilkan ilusi kedalaman panggung
            pointerEvents: 'none', // Mengabaikan klik agar tidak memblokir antarmuka di depannya
            zIndex: 1, // Berada di tumpukan bawah sebelum kartu podium
            animation: 'spotlightPulse 6s infinite ease-in-out' // Menerapkan animasi denyut lambat yang dinamis
          }} />

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
                {/* Judul Klasemen Akhir / Sementara */}
                <h1 style={{ 
                  position: 'absolute', // Pemosisian absolut terpisah di bagian atas layar
                  top: '5rem', // Jarak aman 5rem dari batas atas layar
                  fontSize: 'clamp(5rem, 6vw, 7.5rem)', // Tipografi dinamis agar terbaca jelas di proyektor besar maupun monitor laptop
                  color: '#ffffff', // Warna teks putih kontras tinggi
                  textTransform: 'uppercase', // Selalu huruf kapital untuk nama judul resmi
                  letterSpacing: '0.15em', // Memberikan ruang renggang antar huruf yang bernuansa futuristik
                  textShadow: '0 1rem 3rem rgba(0,0,0,0.8), 0 0 2rem rgba(251,191,36,0.3)', // Bayangan ganda untuk keterbacaan di atas latar gelap
                  opacity: 0, // Mulai dari tidak terlihat untuk di-animasikan masuk
                  fontFamily: "'Outfit', sans-serif", // Menggunakan jenis huruf Outfit yang modern dan tegas
                  fontWeight: 900, // Ketebalan ekstra tebal untuk judul utama
                  animation: 'trackingExpand 1.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards', // Efek pembukaan sinematik
                  zIndex: 3 // Di atas elemen sorotan latar belakang
                }}>
                  KLASEMEN <span style={{ color: '#fbbf24', textShadow: '0 0 3rem rgba(251,191,36,0.6)' }}>{gameState.rankingTitle || 'AKHIR'}</span>
                </h1>
                
                {/* Kontainer Barisan Podium */}
                <div style={{ 
                  display: 'flex', // Menyejajarkan barisan podium secara horizontal
                  justifyContent: 'center', // Memusatkan deretan podium di tengah layar
                  alignItems: 'flex-end', // Meratakan ujung bawah podium agar menempel sempurna di dasar layar
                  gap: '1.8rem', // Memberikan celah renggang antar barisan podium sebesar 1.8rem
                  width: '100%', // Lebar kontainer penuh
                  maxWidth: '160rem', // Batas lebar maksimal kontainer agar tidak melar di layar ultra-lebar
                  height: '75vh', // Menggunakan 75% dari tinggi viewport agar menyisakan ruang bagi judul di atas
                  zIndex: 2 // Di atas sorotan panggung utama
                }}>
                  {podiumOrder.map(({ team, rank }, index) => {
                    const isWinner = rank === 1; // Menandai jika tim menempati peringkat pertama
                    
                    // Menentukan apakah visualisasi saat ini adalah Klasemen Akhir (bukan Klasemen Sementara)
                    const isKlasemenAkhir = gameState.rankingTitle?.toLowerCase() !== 'sementara';
                    
                    // Jeda animasi masuk: peringkat bawah naik lebih dulu, podium juara 3, 2, 1 dibuat berjarak dramatis khusus di Klasemen Akhir
                    let delay = 0; // Menginisialisasi variabel delay bernilai 0
                    if (isKlasemenAkhir) {
                      // Logika khusus Klasemen Akhir: peringkat 3, 2, dan 1 masuk secara perlahan satu per satu
                      if (rank === 1) {
                        delay = 8.5; // Juara 1 muncul paling akhir secara megah (+3.0s setelah Juara 2)
                      } else if (rank === 2) {
                        delay = 5.5; // Juara 2 muncul perlahan setelah Juara 3 (+2.0s)
                      } else if (rank === 3) {
                        delay = 3.5; // Juara 3 muncul setelah barisan bawah (+1.5s)
                      } else {
                        // Peringkat bawah (4, 5, 6) muncul secara berurutan cepat dengan jeda 1 detik
                        delay = Math.max(0, (rankingTeams.length - rank) * 1.0);
                      }
                    } else {
                      // Logika Klasemen Sementara: visualisasi masuk secara cepat dan konstan (jeda 1.0 detik) agar efisien
                      delay = (rankingTeams.length - rank) * 1.0;
                    } 
                    
                    // Skala tinggi dinamis barisan podium
                    const heightPercentages = [100, 72, 58, 46, 36, 28]; // Persentase tinggi tiap peringkat
                    const heightPercent = heightPercentages[rank - 1] || 25; // Mengambil data tinggi atau default ke 25%

                    return (
                      // Kontainer Utama Kartu Tim Peringkat
                      <div key={team.id} style={{
                        flex: isWinner ? 1.5 : 1, // Juara 1 dibuat lebih lebar sebesar 1.5 kali lipat dari yang lain
                        display: 'flex', // Menyusun elemen mahkota dan baris podium secara kolom
                        flexDirection: 'column', // Mengatur flexbox secara vertikal
                        alignItems: 'center', // Menyejajarkan elemen anak (mahkota, bar podium) tepat di tengah kolom
                        height: `${heightPercent}%`, // Menyesuaikan tinggi sesuai persentase peringkatnya
                        opacity: 0, // Awal tidak terlihat sebelum animasi naik dimulai
                        animation: 'dramaticRise 1.3s cubic-bezier(0.25, 1, 0.5, 1) forwards', // Menerapkan efek masuk elastis
                        animationDelay: `${delay}s`, // Menerapkan delay berjenjang untuk memunculkan satu per satu
                        zIndex: isWinner ? 10 : 5, // Pemenang utama ditaruh di tumpukan terdepan agar menutupi yang lain jika bersentuhan
                        position: 'relative' // Menyediakan ruang koordinat lokal bagi elemen absolut di dalamnya
                      }}>
                        
                        {/* Sorotan cahaya belakang berwarna tim untuk efek panggung */}
                        <div style={{
                          position: 'absolute', // Menempel secara absolut di belakang podium masing-masing tim
                          bottom: 0, // Mengunci di bagian bawah
                          left: '50%', // Menjajarkan di tengah horizontal
                          transform: 'translateX(-50%)', // Memusatkan titik tengah koordinat
                          width: '180%', // Lebar sorotan dibuat melebihi lebar kartu agar berpendar ke samping
                          height: '140%', // Tinggi pendaran sorotan warna tim
                          background: `radial-gradient(ellipse at bottom, ${hexToRgba(team.color, 0.3)} 0%, transparent 70%)`, // Gradasi pancaran sesuai warna identitas tim
                          filter: 'blur(3.5rem)', // Efek blur lembut agar pendaran menyatu dengan panggung utama
                          opacity: 0, // Mulai dari transparan
                          animation: 'fadeInSpotlight 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards', // Memudarkan sorotan masuk sesaat setelah podium naik
                          animationDelay: `${delay + 0.8}s`, // Jeda waktu menyelaraskan dengan naiknya podium
                          pointerEvents: 'none', // Menghindari interaksi kursor mouse
                          zIndex: -1 // Diletakkan di belakang kartu bar podium
                        }} />
                        
                        {/* Render khusus Mahkota Emas bagi Juara 1 */}
                        {isWinner && (
                          <div style={{ 
                            marginBottom: '2rem', // Memberi jarak 2rem dari mahkota ke bar podium bawah
                            animation: `fadeInCrown 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, crownFloat 3.5s ease-in-out infinite 1.2s`, // Animasi masuk kemudian berlanjut melayang
                            animationDelay: `${delay + 1.2}s, ${delay + 2.4}s`, // Delay sinkron setelah podium juara 1 mendarat
                            color: '#fbbf24', // Warna dasar kuning emas hangat
                            opacity: 0, // Awal tidak terlihat
                            zIndex: 12 // Diletakkan di tumpukan teratas mahkota
                          }}>
                            {/* Gambar Vektor Mahkota Emas Premium dengan Detail Permata */}
                            <svg width="8rem" height="8rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0.8rem 2.5rem rgba(251,191,36,0.6))' }}>
                              {/* Gradasi warna emas premium (logam mengkilap) */}
                              <defs>
                                <linearGradient id="premiumGold" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#ffe066" />
                                  <stop offset="40%" stopColor="#f59e0b" />
                                  <stop offset="70%" stopColor="#d97706" />
                                  <stop offset="100%" stopColor="#92400e" />
                                </linearGradient>
                                <linearGradient id="gemBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#60a5fa" />
                                  <stop offset="100%" stopColor="#1d4ed8" />
                                </linearGradient>
                                <linearGradient id="gemRed" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#f87171" />
                                  <stop offset="100%" stopColor="#b91c1c" />
                                </linearGradient>
                              </defs>
                              
                              {/* Pola utama mahkota */}
                              <path 
                                d="M2 16 L4 8 C4.5 6.5 5.5 6.5 6 8 L8 12 L11.5 5 C11.8 4.3 12.2 4.3 12.5 5 L16 12 L18 8 C18.5 6.5 19.5 6.5 20 8 L22 16 C22 17 21 18 19 18.2 C15 18.6 9 18.6 5 18.2 C3 18 2 17 2 16 Z" 
                                fill="url(#premiumGold)" 
                                stroke="#78350f" 
                                strokeWidth="0.5" 
                                strokeLinejoin="round" 
                              />
                              
                              {/* Ikat bawah mahkota (crown band) */}
                              <path 
                                d="M4 16.5 C8 17.2 16 17.2 20 16.5 L19.5 18 C15.5 18.5 8.5 18.5 4.5 18 Z" 
                                fill="#78350f" 
                              />
                              
                              {/* Mutiara/Bulatan emas di puncak setiap duri mahkota */}
                              <circle cx="4" cy="7.5" r="1" fill="#ffe066" stroke="#d97706" strokeWidth="0.3" />
                              <circle cx="12" cy="4.5" r="1.3" fill="#ffe066" stroke="#d97706" strokeWidth="0.3" />
                              <circle cx="20" cy="7.5" r="1" fill="#ffe066" stroke="#d97706" strokeWidth="0.3" />
                              
                              {/* Permata/Ruby Hiasan di bagian ikat mahkota */}
                              <rect x="11" y="16.7" width="2" height="1" rx="0.5" fill="url(#gemRed)" />
                              <circle cx="7" cy="17" r="0.6" fill="url(#gemBlue)" />
                              <circle cx="17" cy="17" r="0.6" fill="url(#gemBlue)" />
                            </svg>
                          </div>
                        )}

                        {/* Kartu Bar Fisik Podium */}
                        <div style={{
                          background: isWinner 
                            ? 'linear-gradient(135deg, rgba(24, 24, 37, 0.95) 0%, rgba(46, 38, 20, 0.98) 100%)' // Gradasi logam arang gelap dengan bias emas mewah
                            : `linear-gradient(to top, ${hexToRgba(team.color, 0.85)} 0%, ${hexToRgba(team.color, 0.15)} 100%)`, // Gradasi standar sesuai warna masing-masing tim
                          borderTop: isWinner ? '0.4rem solid #fbbf24' : `0.3rem solid ${team.color}`, // Garis tepi atas tebal sebagai aksen warna tim
                          borderLeft: isWinner ? '0.15rem solid rgba(251, 191, 36, 0.4)' : `0.1rem solid ${hexToRgba(team.color, 0.35)}`, // Batas samping kiri transparan
                          borderRight: isWinner ? '0.15rem solid rgba(251, 191, 36, 0.4)' : `0.1rem solid ${hexToRgba(team.color, 0.35)}`, // Batas samping kanan transparan
                          width: '100%', // Lebar penuh menyesuaikan kolom flex
                          height: '100%', // Mengisi sisa tinggi kolom sepenuhnya
                          display: 'flex', // Mengatur isi kartu secara vertikal
                          flexDirection: 'column', // Arah susunan elemen ke bawah
                          alignItems: 'center', // Memposisikan teks di tengah horizontal kartu
                          justifyContent: 'flex-start', // Menyusun elemen dari atas ke bawah
                          padding: isWinner ? '3rem 1.5rem' : '2.5rem 1.5rem', // Padding responsif lebih besar untuk juara 1
                          borderRadius: '1.8rem 1.8rem 0 0', // Sudut melengkung premium di bagian atas saja
                          boxShadow: isWinner 
                            ? '0 1rem 4rem rgba(0, 0, 0, 0.6), inset 0 0 3rem rgba(251, 191, 36, 0.05)'
                            : `0 -1rem 4rem ${hexToRgba(team.color, 0.25)}, inset 0 2rem 4rem ${hexToRgba(team.color, 0.08)}`, // Efek bayangan redup untuk selain juara 1
                          animation: isWinner ? 'championGlow 3s infinite ease-in-out' : 'none', // Menerapkan pendaran emas mewah jika juara 1
                          animationDelay: isWinner ? `${delay + 1.2}s` : 'none', // Jeda pendaran setelah podium selesai mendarat
                          position: 'relative', // Konteks posisi relatif bagi overlay kilasan cahaya
                          overflow: 'hidden' // Mencegah kilasan cahaya keluar dari batas lekukan sudut kartu
                        }}>
                          
                          {/* Efek kilasan cahaya diagonal (shimmer sweep) yang menyapu permukaan kartu secara berkala */}
                          <div style={{
                            position: 'absolute', // Menempel secara absolut menutupi kartu
                            top: 0, // Batas atas
                            left: 0, // Batas kiri
                            width: '200%', // Lebar dibuat 2 kali lipat agar sapuan dari kiri ke kanan terlihat sempurna
                            height: '100%', // Tinggi penuh
                            background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)', // Garis kilau putih memudar di tengah gradasi
                            animation: 'shimmerSweep 4s infinite ease-in-out', // Kecepatan sapuan gloss 4 detik secara berulang
                            animationDelay: `${delay + 1.5}s`, // Mulai menyapu setelah podium berdiri kokoh
                            pointerEvents: 'none', // Mengabaikan deteksi kursor
                            zIndex: 2 // Di atas tulisan angka peringkat latar belakang agar sapuan menyinari teks
                          }} />

                          {/* Angka Peringkat Transparan di Latar Belakang Kartu */}
                          <div style={{
                            position: 'absolute', // Diposisikan melayang secara absolut
                            top: '10%', // Jarak 10% dari atas kartu
                            left: '50%', // Tengah horizontal
                            transform: 'translateX(-50%)', // Memposisikan anchor pas di tengah
                            fontSize: '20rem', // Ukuran font raksasa
                            fontWeight: 900, // Ketebalan ekstra tebal
                            color: 'rgba(255,255,255,0.035)', // Warna putih ultra transparan agar samar di latar belakang
                            lineHeight: 0.8, // Mengurangi spasi baris agar rapat
                            pointerEvents: 'none', // Abaikan sentuhan kursor mouse
                            zIndex: 0 // Berada paling belakang di dalam kartu
                          }}>
                            {rank}
                          </div>

                          {/* Label Peringkat atau Juara berdasarkan tipe klasemen */}
                          <span style={{ 
                            fontSize: isWinner ? '2.4rem' : '1.8rem', // Mengatur ukuran font yang lebih besar khusus untuk pemenang utama podium
                            fontWeight: 600, // Menggunakan ketebalan font semi-bold agar teks terlihat tegas
                            color: '#94a3b8', // Menggunakan warna abu-abu kebiruan (slate) agar harmonis dengan tema gelap
                            textTransform: 'uppercase', // Mengubah tulisan menjadi huruf besar secara otomatis
                            letterSpacing: '0.1em', // Menambahkan spasi antar-karakter untuk tampilan visual yang lebih elegan
                            zIndex: 1 // Memastikan teks berada di atas bayangan angka peringkat latar belakang
                          }}>
                            {/* Menampilkan label "Peringkat" jika judul klasemen adalah "Sementara", atau label "Juara" untuk klasemen akhir */}
                            {gameState.rankingTitle?.toLowerCase() === 'sementara' ? `Peringkat ${rank}` : `Juara ${rank}`}
                          </span>

                          {/* Teks Nama Tim */}
                          <span style={{ 
                            fontSize: isWinner ? '3.6rem' : '2.4rem', // Ukuran font nama tim lebih besar untuk pemenang
                            fontWeight: 800, // Ketebalan ekstra tebal
                            color: '#ffffff', // Warna teks putih
                            marginTop: '1rem', // Jarak atas 1rem dari label peringkat
                            textTransform: 'uppercase', // Otomatis mengubah ke huruf kapital
                            letterSpacing: '0.05em', // Jarak renggang antar huruf tipis
                            textAlign: 'center', // Teks diletakkan rata tengah
                            textShadow: '0 0.5rem 1rem rgba(0,0,0,0.5)', // Efek bayangan teks agar menonjol dari latar belakang podium
                            zIndex: 1 // Berada di depan lapisan angka transparan
                          }}>
                            {team.name}
                          </span>
                          
                          {/* Kontainer Skor Poin Akhir di bagian bawah kartu */}
                          <div style={{
                            marginTop: 'auto', // Mendorong kontainer poin ini otomatis ke posisi terbawah kartu
                            marginBottom: '2rem', // Jarak aman 2rem dari batas bawah kartu
                            display: 'flex', // Tata letak flex untuk penyusunan teks poin secara kolom
                            flexDirection: 'column', // Arah susunan elemen ke bawah
                            alignItems: 'center', // Rata tengah secara horizontal
                            zIndex: 1 // Di atas lapisan angka transparan
                          }}>
                            {/* Label Kecil "Poin Akhir" */}
                            <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Poin Akhir</span>
                            {/* Nilai Skor Tim */}
                            <span style={{ 
                              fontSize: isWinner ? '5rem' : '3.6rem', // Ukuran poin raksasa terutama bagi pemenang
                              fontWeight: 900, // Tebal maksimal
                              color: isWinner ? '#fbbf24' : '#ffffff', // Warna kuning emas bagi pemenang utama, putih bagi lainnya
                              textShadow: `0 0 2rem ${isWinner ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.4)'}`, // Efek cahaya neon di sekeliling poin
                              fontFamily: "'Outfit', sans-serif", // Font Outfit premium
                              lineHeight: 1, // Menempel ketat tanpa margin tinggi sisa
                              marginTop: '0.5rem' // Jarak atas 0.5rem dari label poin akhir
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

      {/* Menampilkan logo Kediri Technopark secara absolut di bagian kanan atas layar tanpa teks "Powered by" */}
      <BrandingLogo />

    </div>
  );
}
