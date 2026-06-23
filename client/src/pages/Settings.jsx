import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

/**
 * Komponen: Settings
 * Tujuan: Menyediakan pengaturan global untuk tema tampilan dan operasi reset database dengan icon SVG modern.
 */
export default function Settings() {
  // State tema aktif
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('eccs_theme') || 'default';
  });
  // State penanganan status pesan pembersihan data
  const [statusMessage, setStatusMessage] = useState('');

  /**
   * Fungsi: handleThemeChange (Nonaktif)
   * Tema dikunci ke "Neon Cyber Dark" (default)
   */
  // const handleThemeChange = (selectedTheme) => { ... };

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
          title: 'Berhasil!',
          text: 'Seluruh log histori mutasi berhasil dihapus!',
          icon: 'success',
          background: '#0f172a',
          color: '#f8fafc',
          confirmButtonColor: '#10b981',
          customClass: { popup: 'glass-card' }
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

  /**
   * Fungsi: handleResetScores
   * Tujuan: Mereset skor seluruh tim menjadi 0 dan menghapus histori.
   */
  const handleResetScores = async () => {
    const result = await Swal.fire({
      title: 'Peringatan Kritis',
      html: 'Apakah Anda yakin ingin mereset <strong>semua skor tim menjadi 0</strong>?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Reset Skor',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f8fafc',
      customClass: { popup: 'glass-card' }
    });

    if (!result.isConfirmed) {
      return; // Batal jika ditolak
    }

    try {
      setStatusMessage('Mereset skor...');
      
      const teamsRes = await fetch('http://localhost:5000/api/teams');
      const teams = await teamsRes.json();
      
      // Update setiap tim agar skornya kembali ke 0
      for (const team of teams) {
        await fetch(`http://localhost:5000/api/teams/${team.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: team.name, color: team.color, score: 0 })
        });
      }

      setStatusMessage('Semua skor tim berhasil dinolkan!');
      Swal.fire({
        title: 'Berhasil!',
        text: 'Semua skor tim berhasil dinolkan!',
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#10b981',
        customClass: { popup: 'glass-card' }
      });
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Gagal mereset skor:', err);
      setStatusMessage('Gagal mereset skor.');
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

  return (
    <div className="app-container">
      <h1>Pengaturan Sistem</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.5rem' }}>
        Konfigurasi tema antarmuka dan pemeliharaan data pertandingan.
      </p>

      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(32rem, 1fr))' }}>
        {/* Panel Tema telah dihapus berdasarkan instruksi pengguna (Locked to Neon Cyber) */}

        {/* Panel 2: Reset & Database Operations */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Settings Cog SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Pemeliharaan Data</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', marginBottom: '2.5rem' }}>
              Kelola status database untuk memulai turnamen baru dari awal.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Opsi Reset Skor */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '0.1rem solid rgba(255,255,255,0.05)', borderRadius: '1.2rem', padding: '2rem' }}>
                <strong style={{ fontSize: '1.5rem', color: '#f87171', display: 'block', marginBottom: '0.5rem' }}>
                  Nolkan Semua Skor (Reset Scores)
                </strong>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Mengatur ulang skor seluruh tim menjadi 0. Data nama tim dan babak tetap dipertahankan.
                </p>
                <button className="btn btn-danger" onClick={handleResetScores} style={{ width: '100%' }}>
                  🔄 Nolkan Skor Sekarang
                </button>
              </div>

              {/* Opsi Clear Logs */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '0.1rem solid rgba(255,255,255,0.05)', borderRadius: '1.2rem', padding: '2rem' }}>
                <strong style={{ fontSize: '1.5rem', color: '#f97316', display: 'block', marginBottom: '0.5rem' }}>
                  Bersihkan Histori (Clear Logs)
                </strong>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Menghapus semua histori penambahan dan pengurangan skor yang tercatat di dashboard.
                </p>
                <button 
                  className="btn" 
                  onClick={handleClearLogs} 
                  style={{ width: '100%', background: 'transparent', color: '#f97316', border: '0.1rem solid rgba(249, 115, 22, 0.5)' }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(249, 115, 22, 0.1)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                >
                  🗑️ Hapus Log Mutasi
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Status Tindakan */}
          {statusMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '0.1rem solid rgba(16, 185, 129, 0.2)',
              borderRadius: '0.8rem',
              color: '#34d399',
              fontSize: '1.3rem',
              padding: '1.2rem',
              marginTop: '2rem',
              textAlign: 'center'
            }}>
              ✅ {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
