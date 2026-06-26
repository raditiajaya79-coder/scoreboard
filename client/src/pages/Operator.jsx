import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import ScoringPanel from '../components/operator/ScoringPanel';
import ActionLogTable from '../components/operator/ActionLogTable';
import EngineControls from '../components/operator/EngineControls';

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
    tebakKataMaxPlayers: 6,
    showTimerFullScreen: false,
    showRankingFullScreen: false
  });

  // ==========================================
  // EFFECTS & SOCKET SYNC
  // ==========================================
  useEffect(() => {
    // 1. Mengambil data awal via REST API secara paralel
    const fetchInitialData = async () => {
      try {
        // Melakukan request secara paralel untuk mengambil data tim, babak, log, dan state game saat ini
        const [tmRes, rdRes, lgRes, gsRes] = await Promise.all([
          // Mengambil daftar tim
          fetch('http://localhost:5000/api/teams'),
          // Mengambil konfigurasi babak
          fetch('http://localhost:5000/api/rounds'),
          // Mengambil log histori perubahan nilai
          fetch('http://localhost:5000/api/logs'),
          // Mengambil state game aktif dari memori server
          fetch('http://localhost:5000/api/game-state')
        ]);
        // Menetapkan state tim lokal
        setTeams(await tmRes.json());
        // Menetapkan state babak lokal
        setRounds(await rdRes.json());
        // Menetapkan state log aktivitas lokal
        setLogs(await lgRes.json());
        // Membaca game state awal hasil response JSON
        const initialGameState = await gsRes.json();
        // Menetapkannya ke state game lokal agar konsisten setelah reload
        setGameState(initialGameState);
      } catch (err) {
        // Mencatat pesan kegagalan ke dalam log konsol
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
      
      // Jika yang dipilih adalah Tebak Kata, otomatis buka layar timernya
      const isTebakKata = selected.name.toLowerCase().includes('tebak kata');
      
      // Menentukan tim aktif untuk mode Tebak Kata: gunakan tim terpilih sebelumnya jika ada, jika tidak, otomatis gunakan tim pertama dari daftar tim
      const defaultTeamId = gameState.tebakKataActiveTeamId || ((isTebakKata && teams.length > 0) ? teams[0].id : null);
      
      socket.emit('update-game-state', {
        activeRoundId: selected.id,
        timerValue: selected.duration,
        timerMax: selected.duration,
        timerType: selected.timer_type,
        timerStatus: 'stopped',
        tebakKataPlayer: 1,
        tebakKataDuration: selected.duration,
        // Menyimpan ID tim yang aktif ke dalam state real-time jika di mode Tebak Kata
        ...(isTebakKata ? { tebakKataActiveTeamId: defaultTeamId } : {}),
        // Auto sinkronisasi layar jika Tebak Kata dipilih, matikan jika Babak 1/2
        ...(isTebakKata ? { showTimerFullScreen: true, showRankingFullScreen: false } : { showTimerFullScreen: false, showRankingFullScreen: false })
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
      
      // Mengambil data tim terbaru pasca reset untuk memperbarui UI lokal operator
      const updatedTeamsRes = await fetch('http://localhost:5000/api/teams');
      // Melakukan parsing data JSON tim terupdate
      const updatedTeamsData = await updatedTeamsRes.json();
      // Memperbarui state teams lokal agar angka skor berubah menjadi 0 seketika
      setTeams(updatedTeamsData);
      
      // Mengambil data log terbaru yang sudah kosong dari server
      const updatedLogsRes = await fetch('http://localhost:5000/api/logs');
      // Melakukan parsing data JSON log kosong
      const updatedLogsData = await updatedLogsRes.json();
      // Memperbarui state logs lokal agar tabel riwayat terhapus seketika
      setLogs(updatedLogsData);
      
      // Reset juga state game terkait pengumuman
      socket.emit('update-game-state', { hasShownKlasemenSementara: false, showRankingFullScreen: false });
      
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
        {/* Baris grid otomatis dengan kolom minimum 28rem agar pas di layar laptop kecil maupun mobile tanpa overflow */}
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(28rem, 1fr))', marginBottom: 0 }}>
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
                    <strong style={{ color: gameState.showRankingFullScreen ? '#fbbf24' : gameState.showTimerFullScreen ? '#10b981' : '#6366f1', textTransform: 'uppercase' }}>
                      {gameState.showRankingFullScreen ? 'Mode Pengumuman Juara' : gameState.showTimerFullScreen ? 'Timer Tebak Kata Aktif' : 'Papan Skor Aktif'}
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
                    let updatePayload = { showTimerFullScreen: false, showRankingFullScreen: false };
                    
                    // Jika saat ini berada di Babak Tebak Kata, otomatis kembali ke Babak 1 (atau babak reguler pertama)
                    if (activeRound && activeRound.name.toLowerCase().includes('tebak kata')) {
                      const regulerRound = rounds.find(r => !r.name.toLowerCase().includes('tebak kata'));
                      if (regulerRound) {
                        updatePayload.activeRoundId = regulerRound.id;
                        updatePayload.timerValue = regulerRound.duration;
                        updatePayload.timerMax = regulerRound.duration;
                        updatePayload.timerType = regulerRound.timer_type;
                        updatePayload.timerStatus = 'stopped';
                        setActiveRound(regulerRound);
                      }
                    }

                    socket.emit('update-game-state', updatePayload);
                  }} 
                  style={{ 
                    width: '100%', 
                    background: (!gameState.showTimerFullScreen && !gameState.showRankingFullScreen) ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255, 255, 255, 0.05)', 
                    border: '0.1rem solid rgba(255, 255, 255, 0.1)', 
                    color: '#ffffff' 
                  }}
                >
                  <span>1. Papan Skor Default</span>
                </button>
                <button 
                  className="btn" 
                  onClick={() => {
                    const tkRound = rounds.find(r => r.name.toLowerCase().includes('tebak kata'));
                    
                    // Menentukan tim aktif untuk mode Tebak Kata: gunakan tim terpilih sebelumnya jika ada, jika tidak, otomatis gunakan tim pertama dari daftar tim
                    const defaultTeamId = gameState.tebakKataActiveTeamId || (teams.length > 0 ? teams[0].id : null);
                    
                    let updatePayload = { 
                      showTimerFullScreen: true, 
                      showRankingFullScreen: false,
                      tebakKataActiveTeamId: defaultTeamId // Otomatis mengisi pilihan tim agar tidak kosong (-- Pilih Tim --)
                    };
                    
                    if (tkRound) {
                      updatePayload.activeRoundId = tkRound.id;
                      updatePayload.timerValue = tkRound.duration;
                      updatePayload.timerMax = tkRound.duration;
                      updatePayload.timerType = tkRound.timer_type;
                      updatePayload.timerStatus = 'stopped';
                      updatePayload.tebakKataDuration = tkRound.duration;
                      setActiveRound(tkRound);
                    }
                    
                    socket.emit('update-game-state', updatePayload);
                  }} 
                  style={{ 
                    width: '100%', 
                    background: gameState.showTimerFullScreen ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)', 
                    border: '0.1rem solid rgba(255, 255, 255, 0.1)', 
                    color: '#ffffff' 
                  }}
                >
                  <span>2. Timer Tebak Kata</span>
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                  <button 
                    className="btn" 
                    onClick={() => {
                      socket.emit('update-game-state', { showTimerFullScreen: false, showRankingFullScreen: true, rankingTitle: 'Sementara', hasShownKlasemenSementara: true, rankingAnimationKey: Date.now() });
                    }} 
                    style={{ 
                      width: '100%', 
                      background: (gameState.showRankingFullScreen && gameState.rankingTitle === 'Sementara') ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.05)', 
                      border: '0.1rem solid rgba(255, 255, 255, 0.1)', 
                      color: '#ffffff',
                      boxShadow: (gameState.showRankingFullScreen && gameState.rankingTitle === 'Sementara') ? '0 0 1.5rem rgba(245, 158, 11, 0.4)' : 'none',
                      fontSize: '1.2rem',
                      padding: '1rem'
                    }}
                  >
                    <span>Klasemen Sementara</span>
                  </button>
                  <button 
                    className="btn" 
                    disabled={!gameState.hasShownKlasemenSementara}
                    onClick={() => {
                      socket.emit('update-game-state', { showTimerFullScreen: false, showRankingFullScreen: true, rankingTitle: 'Akhir', rankingAnimationKey: Date.now() });
                    }} 
                    style={{ 
                      width: '100%', 
                      background: (gameState.showRankingFullScreen && gameState.rankingTitle === 'Akhir') ? 'linear-gradient(135deg, #f59e0b, #d97706)' : (!gameState.hasShownKlasemenSementara ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)'), 
                      border: '0.1rem solid rgba(255, 255, 255, 0.1)', 
                      color: !gameState.hasShownKlasemenSementara ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                      boxShadow: (gameState.showRankingFullScreen && gameState.rankingTitle === 'Akhir') ? '0 0 1.5rem rgba(245, 158, 11, 0.4)' : 'none',
                      fontSize: '1.2rem',
                      padding: '1rem',
                      cursor: !gameState.hasShownKlasemenSementara ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {!gameState.hasShownKlasemenSementara && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                    <span>Klasemen Akhir</span>
                  </button>
                </div>
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
        {/* Baris grid otomatis dengan kolom minimum 28rem agar pas di layar laptop kecil maupun mobile tanpa overflow */}
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(28rem, 1fr))', alignItems: 'stretch', marginBottom: 0 }}>
          
          {/* Kolom Kiri: Modul Engine Khusus Babak */}
          <EngineControls 
            activeRound={activeRound}
            gameState={gameState}
            teams={teams}
            socket={socket}
            startTimer={startTimer}
            pauseTimer={pauseTimer}
            resetTimer={resetTimer}
            nextTebakKataPlayer={nextTebakKataPlayer}
            handleTebakKataSuccess={handleTebakKataSuccess}
          />
          {/* Kolom Kanan: Input Nilai Peserta (Meluas penuh otomatis jika kolom kiri kosong) */}
          <ScoringPanel 
            teams={teams}
            activeRound={activeRound}
            gameState={gameState}
            handleScoreChange={handleScoreChange}
            customValue={customValue}
            setCustomValue={setCustomValue}
          />

        </div>

        {/* ROW 3: LOG MUTASI SKOR */}
        <ActionLogTable logs={logs} handleClearLogs={handleClearLogs} />

      </div>
    </div>
  );
}
