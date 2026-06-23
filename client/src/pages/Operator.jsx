import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';

// Membuka koneksi Socket.IO client ke backend server
const socket = io('http://localhost:5000');

/**
 * Komponen: Operator
 * Tujuan: Menyediakan antarmuka kontrol terpadu bagi operator lomba dengan icon SVG yang konsisten,
 * bersih, dan profesional (menghilangkan emoji alay).
 */
export default function Operator() {
  // ==========================================
  // STATE DEFINITIONS
  // ==========================================
  const [teams, setTeams] = useState([]); // Daftar tim
  const [rounds, setRounds] = useState([]); // Daftar babak
  const [activeRound, setActiveRound] = useState(null); // Babak aktif lokal
  const [logs, setLogs] = useState([]); // Log histori skor
  const [customValue, setCustomValue] = useState(50); // Nilai modifikasi kustom
  const [isRoundDropdownOpen, setIsRoundDropdownOpen] = useState(false); // State untuk dropdown custom
  const roundDropdownRef = useRef(null); // Ref untuk menutup dropdown saat klik luar

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roundDropdownRef.current && !roundDropdownRef.current.contains(event.target)) {
        setIsRoundDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time state game dari server
  const [gameState, setGameState] = useState({
    activeRoundId: 1,
    timerValue: 0,
    timerMax: 30,
    timerStatus: 'stopped',
    timerType: 'countdown',
    activeBuzzerTeam: null,
    isBuzzerLocked: false,
    revealScores: true,
    tebakKataPlayer: 1,
    tebakKataMaxPlayers: 6
  });

  // ==========================================
  // EFFECTS & SOCKET SYNC
  // ==========================================
  useEffect(() => {
    // 1. Mengambil data awal via REST API
    const fetchInitialData = async () => {
      try {
        const teamsRes = await fetch('http://localhost:5000/api/teams');
        setTeams(await teamsRes.json());

        const roundsRes = await fetch('http://localhost:5000/api/rounds');
        const roundsData = await roundsRes.json();
        setRounds(roundsData);

        const logsRes = await fetch('http://localhost:5000/api/logs');
        setLogs(await logsRes.json());
      } catch (err) {
        console.error('Gagal mengambil data operator:', err);
      }
    };

    fetchInitialData();

    // 2. Pasang event listeners WebSockets
    // Mendengar state game terupdate
    socket.on('game-state', (updatedState) => {
      setGameState(updatedState);
    });

    // Mendengar detik timer berjalan
    socket.on('timer-tick', (tickValue) => {
      setGameState((prev) => ({ ...prev, timerValue: tickValue }));
    });

    // Mendengar daftar tim terupdate
    socket.on('teams-updated', (updatedTeams) => {
      setTeams(updatedTeams);
    });

    // Mendengar log histori terupdate
    socket.on('logs-updated', (updatedLogs) => {
      setLogs(updatedLogs);
    });

    // Membersihkan listener
    return () => {
      socket.off('game-state');
      socket.off('timer-tick');
      socket.off('teams-updated');
      socket.off('logs-updated');
    };
  }, []);

  // Update data babak aktif secara lokal jika activeRoundId berubah
  useEffect(() => {
    if (rounds.length > 0) {
      const current = rounds.find((r) => r.id === gameState.activeRoundId);
      setActiveRound(current || rounds[0]);
    }
  }, [gameState.activeRoundId, rounds]);

  // ==========================================
  // CONTROL ACTIONS
  // ==========================================

  // Pindah babak aktif
  const handleSelectRound = (roundId) => {
    const selected = rounds.find((r) => r.id === parseInt(roundId));
    if (selected) {
      setActiveRound(selected);
      socket.emit('update-game-state', {
        activeRoundId: selected.id,
        timerValue: selected.duration,
        timerMax: selected.duration,
        timerType: selected.timer_type,
        timerStatus: 'stopped',
        tebakKataPlayer: 1
      });
    }
  };

  // Kirim perubahan skor ke server
  const handleScoreChange = async (teamId, value, desc) => {
    if (!activeRound) return;

    try {
      await fetch('http://localhost:5000/api/scores/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          round_id: activeRound.id,
          change_value: value,
          description: desc
        })
      });
    } catch (err) {
      console.error('Gagal mengubah skor:', err);
    }
  };

  // Batalkan aksi skor terakhir (Undo Engine)
  const handleUndo = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/scores/undo', {
        method: 'POST'
      });
      if (res.ok) {
        console.log('Undo berhasil.');
      }
    } catch (err) {
      console.error('Gagal melakukan undo:', err);
    }
  };

  /**
   * Membuka modal konfirmasi untuk mereset seluruh skor menggunakan SweetAlert2
   */
  const handleResetScores = async () => {
    const result = await Swal.fire({
      title: 'Peringatan Kritis',
      html: 'Apakah Anda yakin ingin mereset <strong>semua skor tim menjadi 0</strong>?<br/><br/><span style="color:#f43f5e; font-weight:bold;">Tindakan ini tidak dapat dibatalkan!</span>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Reset Semua Skor',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f8fafc',
      customClass: {
        popup: 'glass-card'
      }
    });

    if (result.isConfirmed) {
      confirmResetScores();
    }
  };

  /**
   * Eksekusi reset seluruh skor ke 0 setelah dikonfirmasi pengguna
   */
  const confirmResetScores = async () => {
    try {
      const teamsRes = await fetch('http://localhost:5000/api/teams');
      const teamsData = await teamsRes.json();
      
      for (const team of teamsData) {
        await fetch(`http://localhost:5000/api/teams/${team.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: team.name, color: team.color, score: 0 })
        });
      }
      
      // Hapus semua histori log agar perhitungan skor per babak juga kembali ke 0
      await fetch('http://localhost:5000/api/logs', { method: 'DELETE' });
      
      Swal.fire({
        title: 'Berhasil!',
        text: 'Semua skor tim berhasil dinolkan.',
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#10b981',
        customClass: { popup: 'glass-card' }
      });
    } catch (err) {
      console.error('Gagal mereset skor:', err);
      Swal.fire({
        title: 'Gagal',
        text: 'Gagal mereset skor. Pastikan server berjalan.',
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f43f5e',
        customClass: { popup: 'glass-card' }
      });
    }
  };

  /**
   * Menghapus seluruh histori log skor
   */
  const handleClearLogs = async () => {
    const result = await Swal.fire({
      title: 'Hapus Log Mutasi?',
      html: 'Apakah Anda yakin ingin menghapus <strong>seluruh histori log mutasi skor</strong>?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Hapus Log',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f8fafc',
      customClass: { popup: 'glass-card' }
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch('http://localhost:5000/api/logs', { method: 'DELETE' });
      if (res.ok) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Histori log berhasil dibersihkan!',
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    } catch (err) {
      console.error('Gagal menghapus log:', err);
      Swal.fire({
        title: 'Gagal',
        text: 'Gagal menghapus log. Pastikan server berjalan.',
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#f43f5e',
        customClass: { popup: 'glass-card' }
      });
    }
  };

  // Tampilkan/sembunyikan skor di proyektor (Reveal Engine)
  const toggleReveal = () => {
    socket.emit('update-game-state', {
      revealScores: !gameState.revealScores
    });
  };

  // ==========================================
  // TIMER ACTIONS
  // ==========================================
  const startTimer = () => socket.emit('timer-start');
  const pauseTimer = () => socket.emit('timer-pause');
  const resetTimer = () => socket.emit('timer-reset', activeRound?.duration || 30);

  // ==========================================
  // BUZZER ACTIONS
  // ==========================================
  const resetBuzzer = () => socket.emit('buzzer-start');

  // ==========================================
  // TEBAK KATA ACTIONS
  // ==========================================
  const nextTebakKataPlayer = () => {
    const nextIdx = gameState.tebakKataPlayer < gameState.tebakKataMaxPlayers
      ? gameState.tebakKataPlayer + 1
      : 1;

    const duration = gameState.tebakKataDuration || 30;

    // 1. Pindah giliran pemain
    socket.emit('update-game-state', {
      tebakKataPlayer: nextIdx
    });

    // 2. Reset durasi sesuai pengaturan Waktu/Orang
    socket.emit('timer-reset', duration);

    // 3. Otomatis mulai jalankan waktu lagi
    socket.emit('timer-start');
  };

  const handleTebakKataSuccess = async (teamId) => {
    await handleScoreChange(teamId, activeRound?.points_correct || 100, `Pemain ${gameState.tebakKataPlayer} menebak kata dengan sukses.`);
    nextTebakKataPlayer();
  };

  return (
    <div className="app-container">
      {/* Header Operator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h1>Panel Operator</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
            Mengontrol babak kompetisi secara real-time. Layar display terhubung otomatis.
          </p>
        </div>
        {/* Grup Tombol Aksi Global */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Tombol Reset Skor */}
          <button className="btn" onClick={handleResetScores} style={{ padding: '1.2rem 2.4rem', background: 'transparent', border: '0.15rem solid #ef4444', color: '#f87171' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Nolkan Semua Skor</span>
          </button>
          
          {/* Tombol Undo Global */}
          <button className="btn btn-danger" onClick={handleUndo} disabled={logs.length === 0} style={{ padding: '1.2rem 2.4rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <polyline points="3 3 3 8 8 8" />
            </svg>
            <span>Batalkan Aksi (Undo)</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
        {/* ROW 1: KONTROL GLOBAL */}
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(40rem, 1fr))', marginBottom: 0 }}>
          {/* 1. Kontrol Layar Proyektor (Display Engine) */}
          <div className="glass-card" style={{ marginBottom: 0, height: '100%', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 0, marginBottom: '1.2rem' }}>
              {/* Screen SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>1. Kontrol Layar Proyektor (Display Engine)</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ flex: '1 1 20rem' }}>
                <p style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
                  Gunakan kendali di bawah ini untuk mengatur mode tampilan pada layar proyektor / eksternal penonton secara instan tanpa memuat ulang halaman.
                </p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', fontSize: '1.3rem' }}>
                  <span>
                    Status Mode: {' '}
                    <strong style={{ color: gameState.showTimerFullScreen ? '#10b981' : '#6366f1', textTransform: 'uppercase' }}>
                      {gameState.showTimerFullScreen ? 'Mode Cepat Tepat Aktif' : 'Papan Skor Aktif'}
                    </strong>
                  </span>
                  <span>
                    Status Skor: {' '}
                    <strong style={{ color: gameState.revealScores ? '#34d399' : '#f43f5e', textTransform: 'uppercase' }}>
                      {gameState.revealScores ? 'Skor Ditampilkan' : 'Skor Disembunyikan'}
                    </strong>
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: '0 0 24rem' }}>
                <button 
                  className="btn" 
                  onClick={() => {
                    // Mengubah status tampilan timer fullscreen di layar proyektor
                    const nextState = !gameState.showTimerFullScreen;
                    
                    // Siapkan payload state baru
                    let newStatePayload = { showTimerFullScreen: nextState };
                    
                    if (!nextState) {
                      // JIKA KEMBALI KE PAPAN SKOR: Otomatis pilih babak "Cerdas Cermat" (jika ada)
                      const ccRound = rounds.find(r => r.name.toLowerCase().includes('cerdas cermat'));
                      if (ccRound) {
                        newStatePayload.activeRoundId = ccRound.id;
                        newStatePayload.timerValue = ccRound.duration;
                        newStatePayload.timerMax = ccRound.duration;
                        newStatePayload.timerType = ccRound.timer_type;
                        newStatePayload.timerStatus = 'stopped';
                        setActiveRound(ccRound);
                      }
                    } else {
                      // JIKA MASUK MODE CEPAT TEPAT: Otomatis pilih babak "Tebak Kata" (jika ada)
                      const tkRound = rounds.find(r => r.name.toLowerCase().includes('tebak kata'));
                      if (tkRound) {
                        newStatePayload.activeRoundId = tkRound.id;
                        newStatePayload.timerValue = tkRound.duration;
                        newStatePayload.timerMax = tkRound.duration;
                        newStatePayload.timerType = tkRound.timer_type;
                        newStatePayload.timerStatus = 'stopped';
                        setActiveRound(tkRound);
                      }
                    }

                    // Memancarkan perubahan state sekaligus ke Socket.IO server
                    socket.emit('update-game-state', newStatePayload);
                  }} 
                  style={{ 
                    width: '100%', 
                    background: gameState.showTimerFullScreen 
                      ? 'linear-gradient(135deg, #10b981, #059669)' 
                      : 'rgba(255, 255, 255, 0.05)', 
                    border: '0.1rem solid rgba(255, 255, 255, 0.1)', 
                    color: '#ffffff' 
                  }}
                >
                  {/* Monitor/Screen SVG */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <span>{gameState.showTimerFullScreen ? 'Kembali ke Papan Skor' : 'Tampilkan Mode Cepat Tepat'}</span>
                </button>
                <button
                  className="btn"
                  style={{
                    background: gameState.revealScores ? 'transparent' : 'var(--gradient-success)',
                    border: gameState.revealScores ? '0.1rem solid #f43f5e' : 'none',
                    color: gameState.revealScores ? '#f43f5e' : '#ffffff',
                    width: '100%',
                    padding: '1rem'
                  }}
                  onClick={toggleReveal}
                >
                  {gameState.revealScores ? (
                    <>
                      {/* Eye Off SVG */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                      <span>Sembunyikan Skor</span>
                    </>
                  ) : (
                    <>
                      {/* Eye Open SVG */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Tampilkan Skor (Reveal)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* 2. Selector Babak (Selalu Muncul) */}
          <div className="glass-card" style={{ marginBottom: 0, height: '100%', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 0, marginBottom: '1.2rem' }}>
              {/* Settings SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>2. Konfigurasi Babak Aktif</span>
            </h2>
            <div className="form-group" style={{ position: 'relative' }} ref={roundDropdownRef}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pilih Babak Lomba
              </label>
              
              {/* Custom Select Button */}
              <div 
                onClick={() => setIsRoundDropdownOpen(!isRoundDropdownOpen)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.2)', 
                  border: isRoundDropdownOpen ? '0.15rem solid var(--accent-color)' : '0.1rem solid rgba(255, 255, 255, 0.1)', 
                  padding: '1.2rem 1.5rem', 
                  borderRadius: '1rem', 
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isRoundDropdownOpen ? '0 0 0 0.3rem rgba(99, 102, 241, 0.2)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: 500 }}>
                  {rounds.find(r => r.id === parseInt(gameState.activeRoundId))?.name || 'Pilih Babak...'}
                </span>
                
                {/* Chevron Icon */}
                <svg 
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ 
                    color: 'var(--text-secondary)', 
                    transform: isRoundDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Custom Dropdown Menu */}
              {isRoundDropdownOpen && (
                <div style={{ 
                  position: 'absolute',
                  top: 'calc(100% + 0.8rem)',
                  left: 0,
                  width: '100%',
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  border: '0.1rem solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '1.2rem',
                  boxShadow: '0 1rem 3rem rgba(0, 0, 0, 0.5), 0 0 0 0.1rem rgba(255, 255, 255, 0.05) inset',
                  zIndex: 50,
                  overflow: 'hidden',
                  animation: 'slideDownFade 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                }}>
                  <div style={{ maxHeight: '30rem', overflowY: 'auto' }}>
                    {rounds.map((r) => {
                      const isSelected = r.id === parseInt(gameState.activeRoundId);
                      return (
                        <div 
                          key={r.id} 
                          onClick={() => {
                            handleSelectRound(r.id);
                            setIsRoundDropdownOpen(false);
                          }}
                          style={{ 
                            padding: '1.2rem 1.5rem', 
                            fontSize: '1.4rem',
                            color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            borderLeft: isSelected ? '0.3rem solid var(--accent-color)' : '0.3rem solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }
                          }}
                        >
                          {isSelected && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          <span style={{ marginLeft: isSelected ? 0 : '2.6rem' }}>{r.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {activeRound && (
              <div style={{ padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '0.1rem solid rgba(255,255,255,0.05)', marginTop: '1.5rem' }}>
                <strong style={{ fontSize: '1.3rem' }}>Aturan Babak:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '0.4rem', marginBottom: '0.8rem' }}>{activeRound.description || 'Tidak ada aturan khusus.'}</p>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                  <span>Benar: <strong style={{ color: '#34d399' }}>+{activeRound.points_correct}</strong></span>
                  <span>Salah: <strong style={{ color: '#f87171' }}>{activeRound.points_wrong}</strong></span>
                  <span>Timer Default: <strong>{activeRound.duration} Detik</strong></span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ROW 2: ENGINE & SKORING */}
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(40rem, 1fr))', alignItems: 'stretch', marginBottom: 0 }}>
          
          {/* Kolom Kiri: Modul Engine Khusus Babak */}
          {( (activeRound?.timer_type !== 'none' && !activeRound?.name.toLowerCase().includes('tebak kata')) || activeRound?.name.toLowerCase().includes('tebak kata') ) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', height: '100%' }}>
              
              {/* 3. Timer Engine (Hanya muncul jika bukan babak Tebak Kata) */}
              {activeRound?.timer_type !== 'none' && !activeRound?.name.toLowerCase().includes('tebak kata') && (
                <div className="glass-card" style={{ marginBottom: 0, height: '100%' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Clock SVG */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>3. Timer Engine (Kontrol Waktu)</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', flex: '1 1 20rem', padding: '2rem', background: 'rgba(0,0,0,0.15)', borderRadius: '1.6rem', border: '0.1rem solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '1.3rem', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    Sisa Waktu
                  </span>
                  <strong style={{ fontSize: '7.2rem', fontFamily: 'var(--font-outfit)', fontWeight: 800, color: gameState.timerValue <= 5 ? '#f43f5e' : '#34d399', letterSpacing: '-0.02em' }}>
                    {gameState.timerValue} <span style={{ fontSize: '2.4rem', fontWeight: 500 }}>Detik</span>
                  </strong>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Status: <strong style={{ textTransform: 'uppercase', color: gameState.timerStatus === 'running' ? '#34d399' : '#f59e0b' }}>{gameState.timerStatus}</strong>
                  </div>
                </div>

                {/* Tombol Timer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: '0 0 24rem' }}>
                  <button className="btn btn-success" onClick={startTimer} disabled={gameState.timerStatus === 'running'} style={{ width: '100%' }}>
                    {/* Play SVG */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Mulai Waktu</span>
                  </button>
                  <button className="btn btn-secondary" onClick={pauseTimer} disabled={gameState.timerStatus !== 'running'} style={{ width: '100%' }}>
                    {/* Pause SVG */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    <span>Jeda Waktu</span>
                  </button>
                  <button className="btn btn-danger" onClick={resetTimer} style={{ width: '100%', background: 'rgba(244, 63, 94, 0.08)', border: '0.1rem solid rgba(244, 63, 94, 0.3)', color: '#f1f5f9' }}>
                    {/* Rotate CCW SVG */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <polyline points="3 3 3 8 8 8" />
                    </svg>
                    <span>Reset Waktu</span>
                  </button>
                </div>
              </div>
            </div>
          )}

              {/* 4. Tebak Kata Engine (Spesifik Babak Tebak Kata - Merged dengan Cepat Tepat) */}
              {activeRound?.name.toLowerCase().includes('tebak kata') && (
                <div className="glass-card" style={{ marginBottom: 0, height: '100%', border: '0.1rem solid #06b6d4', boxShadow: '0 0 2.5rem rgba(6, 182, 212, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {/* Grid/Layout SVG */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" />
                    <rect x="14" y="3" width="7" height="5" />
                    <rect x="14" y="12" width="7" height="9" />
                    <rect x="3" y="16" width="7" height="5" />
                  </svg>
                  <span>4. Modul Estafet Tebak Kata Terpadu</span>
                </h2>
                <span style={{ background: '#06b6d4', color: '#0f172a', fontSize: '1.2rem', padding: '0.4rem 1rem', borderRadius: '0.8rem', fontWeight: 700 }}>
                  MODUL AKTIF
                </span>
              </div>

              {/* Setting Permainan & Timer Timer Khusus */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '2rem', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '1.2rem', marginBottom: '2.5rem', border: '0.1rem solid rgba(255,255,255,0.05)', alignItems: 'end' }}>
                {/* Pilihan Tim */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '1.2rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tim yang Bermain:</label>
                  <select 
                    className="form-control"
                    value={gameState.tebakKataActiveTeamId || ''}
                    onChange={(e) => socket.emit('update-game-state', { tebakKataActiveTeamId: e.target.value ? parseInt(e.target.value) : null })}
                    style={{ color: '#ffffff', background: '#1e293b' }}
                  >
                    <option value="" style={{ color: '#ffffff', background: '#1e293b' }}>-- Pilih Tim --</option>
                    {teams.map(t => <option key={t.id} value={t.id} style={{ color: '#ffffff', background: '#1e293b' }}>{t.name}</option>)}
                  </select>
                </div>

                {/* Durasi per orang */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '1.2rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Waktu / Orang: <strong style={{ color: gameState.timerValue <= 5 ? '#f43f5e' : '#34d399', marginLeft: '0.5rem' }}>{gameState.timerValue}s</strong>
                  </label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={gameState.tebakKataDuration || 30}
                    onChange={(e) => socket.emit('update-game-state', { tebakKataDuration: parseInt(e.target.value) || 30 })}
                  />
                </div>

                {/* Tombol Timer Utama */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <button 
                    className="btn btn-success"
                    style={{ height: '4.5rem', fontSize: '1.4rem' }}
                    onClick={() => {
                      socket.emit('timer-reset', gameState.tebakKataDuration || 30);
                      socket.emit('timer-start');
                    }}
                  >
                    ▶ Mulai
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ height: '4.5rem', fontSize: '1.4rem' }}
                    onClick={pauseTimer}
                  >
                    ⏸ Jeda
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(25rem, 1fr))', gap: '2rem' }}>
                {/* Visual Status Player */}
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '2.5rem', borderRadius: '1.6rem', textAlign: 'center', border: '0.1rem solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Urutan Peserta
                  </span>
                  <strong style={{ fontSize: '5.6rem', color: '#06b6d4', margin: '1rem 0', fontFamily: 'var(--font-outfit)', lineHeight: 1 }}>
                    Player {gameState.tebakKataPlayer}
                  </strong>
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                    Batas Maksimal: {gameState.tebakKataMaxPlayers} Peserta
                  </span>
                </div>

                {/* Tombol Kontrol Estafet */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.1)', padding: '2.5rem', borderRadius: '1.6rem', border: '0.1rem dashed rgba(255,255,255,0.1)' }}>
                  <button className="btn btn-primary" onClick={nextTebakKataPlayer} style={{ background: 'var(--gradient-accent)', padding: '1.5rem', fontSize: '1.4rem' }}>
                    {/* Skip Forward SVG */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 4 15 12 5 20 5 4" />
                      <line x1="19" y1="5" x2="19" y2="19" />
                    </svg>
                    <span>Lanjut Player Berikutnya</span>
                  </button>
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                    Klik tombol di atas untuk memindahkan giliran ke peserta selanjutnya (otomatis reset timer).
                  </p>
                </div>
              </div>

              {/* Tombol Input Skor Cepat Tebak Kata */}
              <div style={{ marginTop: '2.5rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.6rem', border: '0.1rem solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: '1.3rem', fontWeight: 600, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Input Tebak Benar (+{activeRound?.points_correct} Poin)
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(15rem, calc(33.333% - 1rem)), 1fr))', gap: '1.2rem' }}>
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      className="btn"
                      style={{ backgroundColor: t.color, padding: '1.4rem', fontSize: '1.6rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', border: 'none', color: '#fff', fontWeight: 700, boxShadow: '0 0.4rem 1rem rgba(0,0,0,0.2)' }}
                      onClick={() => handleTebakKataSuccess(t.id)}
                    >
                      {/* Check SVG */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
                </div>
              )}
            </div>
          )}

          {/* Kolom Kanan: Input Nilai Peserta (Meluas penuh otomatis jika kolom kiri kosong) */}
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
                        value={customValue}
                        onChange={(e) => setCustomValue(parseInt(e.target.value) || 0)}
                        style={{ flexGrow: 1, width: 'auto', minWidth: '6rem', padding: '0.6rem', fontSize: '1.2rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '0.1rem solid rgba(255,255,255,0.1)' }}
                      />
                      <button
                        className="btn"
                        style={{ flexGrow: 1, padding: '0.6rem 1rem', fontSize: '1.1rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '0.1rem solid rgba(52, 211, 153, 0.2)' }}
                        onClick={() => handleScoreChange(team.id, customValue, `Penambahan manual kustom`)}
                      >
                        + Tambah
                      </button>
                      <button
                        className="btn"
                        style={{ flexGrow: 1, padding: '0.6rem 1rem', fontSize: '1.1rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f87171', border: '0.1rem solid rgba(244, 63, 94, 0.2)' }}
                        onClick={() => handleScoreChange(team.id, -customValue, `Pengurangan manual kustom`)}
                      >
                        - Kurang
                      </button>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ROW 3: LOG MUTASI SKOR */}
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

      </div>
    </div>
  );
}
