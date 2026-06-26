import React from 'react';

export default function EngineControls({ 
  activeRound, 
  gameState, 
  teams, 
  socket, 
  startTimer, 
  pauseTimer, 
  resetTimer, 
  nextTebakKataPlayer, 
  handleTebakKataSuccess 
}) {
  // Hitung ambang batas waktu kritis (danger threshold) secara dinamis sesuai timerMax saat ini
  const dangerThreshold = (gameState.timerMax >= 60 ? 10 : gameState.timerMax >= 30 ? 8 : gameState.timerMax >= 15 ? 5 : 3);
  return (
    <>
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
                  {/* Elemen strong penampil angka sisa waktu detik dengan efek pulsing dinamis saat running */}
                  <strong 
                    // Menambahkan class .timer-running-pulse saat timer aktif ('running') agar angka berdenyut hidup
                    className={gameState.timerStatus === 'running' ? 'timer-running-pulse' : ''}
                    // Gaya inline bawaan untuk ukuran font, ketebalan, dan warna yang menyesuaikan dengan kondisi sisa waktu (merah jika di bawah atau sama dengan dangerThreshold)
                    style={{ fontSize: '7.2rem', fontFamily: 'var(--font-outfit)', fontWeight: 800, color: gameState.timerValue <= dangerThreshold ? '#f43f5e' : '#34d399', letterSpacing: '-0.02em', transition: 'color 0.2s' }}
                  >
                    {gameState.timerValue} <span style={{ fontSize: '2.4rem', fontWeight: 500 }}>Detik</span>
                  </strong>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Status: <strong style={{ textTransform: 'uppercase', color: gameState.timerStatus === 'running' ? '#34d399' : '#f59e0b' }}>{gameState.timerStatus}</strong>
                  </div>
                </div>

                {/* Tombol Timer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: '0 0 24rem' }}>
                  {/* Tombol Mulai Waktu dengan style dinamis berdasarkan state timer (aktif atau tidak) */}
                  <button 
                    // Jika timer sedang aktif ('running'), gunakan class animasi .btn-timer-running agar terlihat berdenyut terang. Jika tidak, gunakan .btn-success biasa.
                    className={`btn ${gameState.timerStatus === 'running' ? 'btn-timer-running' : 'btn-success'}`} 
                    // Jalankan fungsi startTimer ketika diklik
                    onClick={startTimer} 
                    // Tombol disetel disabled saat timer berjalan untuk menghindari penumpukan request, tetapi class CSS akan menjaga opacity-nya tetap kontras
                    disabled={gameState.timerStatus === 'running'} 
                    // Atur lebar tombol penuh 100% dari kontainer sidebar
                    style={{ width: '100%' }}
                  >
                    {gameState.timerStatus === 'running' ? (
                      // Tampilan indikator berdenyut jika waktu sedang berjalan
                      <>
                        {/* Bulatan kecil animasi berkedip sebagai penanda aktivitas */}
                        <span className="spinner-dot" />
                        {/* Teks penjelas status waktu beserta sisa detik berjalan */}
                        <span>Berjalan ({gameState.timerValue}s)...</span>
                      </>
                    ) : (
                      // Tampilan tombol play bawaan jika waktu sedang berhenti/jeda
                      <>
                        {/* Icon Play SVG standar */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        {/* Teks tombol default */}
                        <span>Mulai Waktu</span>
                      </>
                    )}
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '1.2rem', marginBottom: '2.5rem', border: '0.1rem solid rgba(255,255,255,0.05)', alignItems: 'flex-end' }}>
                {/* Pilihan Tim */}
                <div style={{ flex: '1 1 20rem' }}>
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
                <div style={{ flex: '1 1 15rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '1.2rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {/* Label teks penjelas dengan strong tag yang berdenyut dinamis saat running */}
                    Waktu / Orang: <strong 
                      // Menggunakan class .timer-running-pulse saat timer sedang aktif berjalan
                      className={gameState.timerStatus === 'running' ? 'timer-running-pulse' : ''}
                      // Warna teks otomatis berubah menjadi merah ketika sisa waktu kritis (<= dangerThreshold)
                      style={{ color: gameState.timerValue <= dangerThreshold ? '#f43f5e' : '#34d399', marginLeft: '0.5rem', transition: 'color 0.2s' }}
                    >
                      {gameState.timerValue}s
                    </strong>
                  </label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={gameState.tebakKataDuration !== undefined ? gameState.tebakKataDuration : (activeRound?.duration || 30)}
                    onChange={(e) => {
                      const val = e.target.value;
                      socket.emit('update-game-state', { 
                        tebakKataDuration: val === '' ? '' : parseInt(val) 
                      });
                    }}
                  />
                </div>

                {/* Tombol Timer Utama */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: '2 1 30rem' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{ flex: '1 1 10rem', height: '4.5rem', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={pauseTimer}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    <span>Jeda</span>
                  </button>
                  <button 
                    className="btn btn-danger"
                    style={{ flex: '1 1 10rem', height: '4.5rem', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(244, 63, 94, 0.08)', border: '0.1rem solid rgba(244, 63, 94, 0.3)', color: '#f1f5f9' }}
                    onClick={() => socket.emit('timer-reset', gameState.tebakKataDuration || activeRound?.duration || 30)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <polyline points="3 3 3 8 8 8" />
                    </svg>
                    <span>Reset</span>
                  </button>
                  {/* Tombol Mulai/Mulai Ulang Timer Tebak Kata dengan style responsif dinamis */}
                  <button 
                    // Memilih class visual .btn-timer-running jika sedang berjalan untuk indikator pulsing glow, jika tidak gunakan .btn-success
                    className={`btn ${gameState.timerStatus === 'running' ? 'btn-timer-running' : 'btn-success'}`}
                    // Merestart timer ke batas durasi Tebak Kata saat ini lalu memicu command start melalui Socket.IO
                    onClick={() => {
                      // Mengirim sinyal reset waktu ke server dengan parameter durasi tebak kata
                      socket.emit('timer-reset', gameState.tebakKataDuration || activeRound?.duration || 30);
                      // Mengirim sinyal start waktu ke server
                      socket.emit('timer-start');
                    }}
                    // Atur fleksibilitas layout tombol agar presisi di layar laptop/tablet/mobile
                    style={{ flex: '1 1 10rem', height: '4.5rem', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {gameState.timerStatus === 'running' ? (
                      // Tampilan penanda aktif ketika tebak kata sedang berlangsung
                      <>
                        {/* Indikator bulatan berdenyut */}
                        <span className="spinner-dot" />
                        {/* Label dinamis running beserta sisa detik berjalan */}
                        <span>Berjalan ({gameState.timerValue}s)...</span>
                      </>
                    ) : (
                      // Tampilan default tombol Mulai
                      <>
                        {/* Icon Play SVG */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        {/* Label default */}
                        <span>Mulai</span>
                      </>
                    )}
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
                  {(gameState.tebakKataActiveTeamId ? teams.filter(t => t.id === gameState.tebakKataActiveTeamId) : teams).map((t) => (
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
    </>
  );
}
