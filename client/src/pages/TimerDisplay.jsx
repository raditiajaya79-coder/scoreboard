import React, { useState, useEffect, useRef } from 'react';
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
// LOGIKA AUDIO WEB AUDIO API (SYNTHESIZER TIMER)
// ==========================================

// Konteks audio global tunggal yang digunakan kembali untuk mencegah batas maksimal AudioContext browser terlampaui
let globalAudioCtx = null;

/**
 * Fungsi: getAudioContext
 * Deskripsi: Mengembalikan satu-satunya instance AudioContext yang aktif (singleton).
 *            Mengaktifkan kembali (resume) jika ditangguhkan oleh browser.
 */
const getAudioContext = () => {
  // Jika konteks audio belum dibuat, inisialisasi baru
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Aktifkan kembali konteks audio jika dalam keadaan tersuspensi (kebijakan autoplay browser)
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  // Mengembalikan instance konteks audio
  return globalAudioCtx;
};

// Fungsi pembantu global untuk mendapatkan ambang batas waktu kritis (danger threshold) secara dinamis
const getDangerThreshold = (maxVal) => {
  // Jika durasi maksimal 60 detik atau lebih (misal 60s, 90s, dst), ambang kritisnya adalah 10 detik terakhir
  if (maxVal >= 60) return 10;
  // Jika durasi maksimal di atas 30 detik tetapi di bawah 60, ambang kritisnya adalah 8 detik terakhir
  if (maxVal >= 30) return 8;
  // Jika durasi maksimal di atas 15 detik tetapi di bawah 30, ambang kritisnya adalah 5 detik terakhir
  if (maxVal >= 15) return 5;
  // Untuk waktu yang sangat pendek (di bawah 15 detik), ambang kritisnya adalah 3 detik terakhir
  return 3;
};

/**
 * Fungsi: playTickSound
 * Deskripsi: Memicu suara ketukan detik (tick/tock) dengan volume yang ditingkatkan agar terdengar kencang di seluruh ruangan.
 */
const playTickSound = (secondsLeft, maxVal) => {
  try {
    // Mendapatkan konteks audio tunggal
    const ctx = getAudioContext();
    // Mendapatkan waktu sekarang
    const now = ctx.currentTime;
    // Membuat oscillator generator gelombang suara
    const osc = ctx.createOscillator();
    // Membuat gain node pengatur volume
    const g = ctx.createGain();
    
    // Menghubungkan oscillator ke gain, dan gain ke speaker
    osc.connect(g);
    g.connect(ctx.destination);
    
    // Mendapatkan batas waktu kritis secara dinamis berdasarkan durasi maksimal
    const threshold = getDangerThreshold(maxVal || 30);
    
    // Memeriksa apakah sisa waktu berada di bawah atau sama dengan ambang kritis
    if (secondsLeft <= threshold) {
      // Beep peringatan kritis: gelombang sinus tinggi nyaring 850Hz, volume ditingkatkan sangat keras (0.90)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      g.gain.setValueAtTime(0.90, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // Detik biasa: gelombang segitiga woodblock hangat 400Hz, volume ditingkatkan keras (0.60)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      g.gain.setValueAtTime(0.60, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (error) {
    // Log kegagalan suara detikan
    console.error('Gagal memutar detikan:', error);
  }
};

/**
 * Fungsi: playAlarmSound
 * Deskripsi: Memicu suara bel alarm/buzzer selesai dengan volume yang ditingkatkan sangat keras (0.85).
 */
const playAlarmSound = () => {
  try {
    // Mendapatkan konteks audio tunggal
    const ctx = getAudioContext();
    // Mendapatkan stempel waktu saat ini
    const now = ctx.currentTime;
    // Membuat dua osilator untuk efek suara alarm mendengung kencang
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    // Membuat gain node pengatur volume
    const g = ctx.createGain();
    
    // Menyetel osilator pertama ke gelombang gergaji (sawtooth) frekuensi 180Hz
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    
    // Menyetel osilator kedua ke gelombang kotak (square) frekuensi 185Hz
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(185, now);
    
    // Menghubungkan kedua osilator ke gain node
    osc1.connect(g);
    osc2.connect(g);
    // Menghubungkan gain node ke speaker
    g.connect(ctx.destination);
    
    // Menyetel volume puncak alarm ke tingkat sangat keras (0.85)
    g.gain.setValueAtTime(0.85, now);
    // Mempertahankan volume kencang selama 800ms
    g.gain.linearRampToValueAtTime(0.85, now + 0.8);
    // Meluruhkan volume secara eksponensial ke sunyi hingga detik ke-1.2
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    // Menjalankan alarm secara serentak
    osc1.start(now);
    osc2.start(now);
    
    // Menghentikan alarm setelah 1.2 detik
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  } catch (error) {
    // Log kegagalan alarm habis
    console.error('Gagal memutar alarm selesai:', error);
  }
};

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

  // Refs untuk mencatat nilai timer sebelumnya demi membatasi pemicu bunyi ganda
  const lastTimerValueRef = useRef(gameState.timerValue); // Ref penyimpan nilai detik timer sebelumnya
  const lastTimerStatusRef = useRef(gameState.timerStatus); // Ref penyimpan status timer sebelumnya

  // Ambang batas kritis dinamis berdasarkan durasi maksimal timer saat ini
  const dangerThreshold = getDangerThreshold(gameState.timerMax || 30);

  // Efek samping untuk memantau perubahan waktu timer detik demi detik
  useEffect(() => {
    // Membaca nilai detik timer sebelumnya dari ref
    const prevVal = lastTimerValueRef.current;
    
    // Memperbarui ref dengan nilai detik saat ini untuk perbandingan berikutnya
    lastTimerValueRef.current = gameState.timerValue;
    
    // Bunyi detikan: dipicu jika status timer berjalan ('running') dan nilai detik berkurang
    if (gameState.timerStatus === 'running' && gameState.timerValue < prevVal) {
      // Jika sisa waktu di atas 0, putar suara detik (tick/tock)
      if (gameState.timerValue > 0) {
        // Panggil fungsi pemutar suara detik
        playTickSound(gameState.timerValue, gameState.timerMax);
      }
    }
  }, [gameState.timerValue, gameState.timerStatus, gameState.timerMax]);

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
    socket.on('timer-finished', () => {
      // Memutar suara alarm buzzer selesai
      playAlarmSound();
    });
    
    // Bersihkan listener saat unmount
    return () => { 
      socket.off('game-state'); 
      socket.off('timer-tick'); 
      socket.off('timer-finished');
    };
  }, []);

  // Hitung persentase durasi timer berjalan
  const timerPercent = gameState.timerMax > 0 ? (gameState.timerValue / gameState.timerMax) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // radius 45 ring SVG
  const strokeDash = (timerPercent / 100) * circumference;
  
  // Perubahan warna dinamis timer (Merah jika kritis, kuning jika mendekati kritis, hijau jika normal)
  const timerColor = gameState.timerValue <= dangerThreshold 
    ? '#f43f5e' 
    : gameState.timerValue <= dangerThreshold * 2 
      ? '#f59e0b' 
      : '#10b981';

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

      {/* Menampilkan logo Kediri Technopark secara absolut di bagian kanan atas layar tanpa teks "Powered by" */}
      <BrandingLogo />

    </div>
  );
}
