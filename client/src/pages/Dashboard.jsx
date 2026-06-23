import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

/**
 * Komponen: Dashboard
 * Tujuan: Menyajikan visualisasi dashboard utama yang rapi dengan icon SVG profesional untuk
 * melihat rangkuman statistik data peserta tim, babak kompetisi, serta akses display.
 */
export default function Dashboard() {
  // State untuk event aktif
  const [eventData, setEventData] = useState({ name: '', date: '', description: '' });
  // State untuk jumlah tim terdaftar
  const [teamCount, setTeamCount] = useState(0);
  // State untuk jumlah babak terdaftar
  const [roundCount, setRoundCount] = useState(0);
  // State menyimpan info perubahan data event
  const [saveStatus, setSaveStatus] = useState('');
  // State untuk melacak mode proyektor (Timer vs Score) dari socket
  const [gameState, setGameState] = useState(null);
  // Ref untuk koneksi socket
  const [socket, setSocket] = useState(null);

  /**
   * Fungsi: fetchData
   * Tujuan: Mengambil ringkasan statistik dan detail event aktif dari server.
   */
  const fetchData = async () => {
    try {
      // Mengirimkan request ke server untuk mengambil info event
      const eventRes = await fetch('http://localhost:5000/api/event');
      // Mengubah respon event menjadi JSON data
      const eventJson = await eventRes.json();
      // Memperbarui state data event dengan data JSON jika berhasil diambil
      if (eventJson) setEventData(eventJson);

      // Mengirimkan request ke server untuk mengambil data daftar tim
      const teamsRes = await fetch('http://localhost:5000/api/teams');
      // Mengubah respon tim menjadi JSON data
      const teamsJson = await teamsRes.json();
      // Memperbarui state jumlah tim berdasarkan panjang array data tim
      setTeamCount(teamsJson.length);

      // Mengirimkan request ke server untuk mengambil data daftar babak
      const roundsRes = await fetch('http://localhost:5000/api/rounds');
      // Mengubah respon babak menjadi JSON data
      const roundsJson = await roundsRes.json();
      // Memperbarui state jumlah babak berdasarkan panjang array data babak
      setRoundCount(roundsJson.length);
    } catch (err) {
      // Menampilkan log error ke konsol apabila terjadi kendala pengambilan data
      console.error('Gagal mengambil data ringkasan dashboard:', err);
    }
  };

  // Panggil pemuatan data di awal render komponen
  useEffect(() => {
    fetchData(); // Menjalankan fungsi fetch

    // Inisialisasi Socket.IO untuk mendengarkan state Layar Display
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Mendengarkan pembaruan state permainan (mode layar)
    newSocket.on('gameState', (state) => {
      setGameState(state);
    });

    return () => newSocket.close();
  }, []);

  /**
   * Fungsi: handleSaveEvent
   * Parameter: e (Form submit event)
   * Tujuan: Mengupdate informasi nama, deskripsi, dan tanggal event melalui API PUT server.
   */
  const handleSaveEvent = async (e) => {
    // Mencegah reload halaman secara default oleh browser setelah submit form
    e.preventDefault();
    // Mengubah status teks menjadi sedang menyimpan data
    setSaveStatus('Menyimpan data...');

    try {
      // Mengirimkan request PUT dengan method update data event ke backend
      const res = await fetch('http://localhost:5000/api/event', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      // Mengubah respon server menjadi JSON
      const data = await res.json();
      // Mengecek apakah operasi pembaruan berhasil
      if (data.success) {
        // Mengubah status teks menjadi sukses disimpan
        setSaveStatus('Berhasil disimpan!');
        // Menghapus notifikasi sukses secara otomatis setelah 3 detik
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        // Mengubah status menjadi gagal apabila response server error
        setSaveStatus('Gagal menyimpan.');
      }
    } catch (err) {
      // Mengubah status notifikasi jika terjadi kesalahan koneksi jaringan
      setSaveStatus('Kesalahan koneksi ke server.');
    }
  };

  return (
    <div className="app-container">
      <h1>Manajemen Kompetisi</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3.5rem', fontSize: '1.5rem' }}>
        Selamat datang di Smart Competition Manager (SCM). Kelola parameter utama sistem event di sini.
      </p>

      {/* Grid Statistik Rangkuman dengan Icon SVG Profesional (3 Kolom Seimbang) */}
      <div className="grid-auto">
        {/* Card Jumlah Tim Terdaftar */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '0.1rem solid rgba(99, 102, 241, 0.2)',
            borderRadius: '1.2rem',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1'
          }}>
            {/* Users SVG Icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jumlah Tim
            </h3>
            <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-outfit)' }}>{teamCount} <span style={{ fontSize: '1.6rem', fontWeight: 600 }}>Tim</span></span>
          </div>
        </div>

        {/* Card Jumlah Babak Lomba */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.12)',
            border: '0.1rem solid rgba(6, 182, 212, 0.2)',
            borderRadius: '1.2rem',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#06b6d4'
          }}>
            {/* Layers SVG Icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jumlah Babak
            </h3>
            <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-outfit)' }}>{roundCount} <span style={{ fontSize: '1.6rem', fontWeight: 600 }}>Babak</span></span>
          </div>
        </div>

        {/* Card Akses Layar Display Proyektor */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '0.1rem solid rgba(244, 63, 94, 0.2)',
            borderRadius: '1.2rem',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f43f5e'
          }}>
            {/* Screen SVG Icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Layar Proyektor
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.8rem' }}>
              <Link to="/display" target="_blank" rel="noopener noreferrer" style={{
                color: '#f43f5e',
                fontWeight: 700,
                fontSize: '1.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>Buka Layar ↗</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              
              <button 
                className="btn"
                onClick={() => {
                  if (socket && gameState) {
                    socket.emit('update-game-state', { showTimerFullScreen: !gameState.showTimerFullScreen });
                  }
                }}
                style={{
                  background: gameState?.showTimerFullScreen ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
                  border: '0.1rem solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  alignSelf: 'flex-start',
                  padding: '0.6rem 1rem',
                  fontSize: '1.1rem',
                  borderRadius: '0.6rem'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>{gameState?.showTimerFullScreen ? 'Timer Aktif' : 'Skor Aktif'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Input Event & Informasi Panduan */}
      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(32rem, 1fr))' }}>
        {/* Form Detail Event */}
        <div className="glass-card">
          <h2>Konfigurasi Event</h2>
          <form onSubmit={handleSaveEvent}>
            {/* Nama Event */}
            <div className="form-group">
              <label className="form-label" htmlFor="eventName">Nama Event / Lomba</label>
              <input
                type="text"
                id="eventName"
                className="form-control"
                value={eventData.name}
                onChange={(e) => setEventData({ ...eventData, name: e.target.value })} // Update name state
                required
              />
            </div>

            {/* Tanggal Pelaksanaan */}
            <div className="form-group">
              <label className="form-label" htmlFor="eventDate">Tanggal Pelaksanaan</label>
              <input
                type="date"
                id="eventDate"
                className="form-control"
                value={eventData.date}
                onChange={(e) => setEventData({ ...eventData, date: e.target.value })} // Update date state
              />
            </div>

            {/* Deskripsi Event */}
            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
              <label className="form-label" htmlFor="eventDesc">Deskripsi Event</label>
              <textarea
                id="eventDesc"
                className="form-control"
                rows="3"
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })} // Update description state
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Simpan & Feedback */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <button type="submit" className="btn btn-primary">
                Simpan Perubahan
              </button>
              {saveStatus && <span style={{ fontSize: '1.3rem', color: '#10b981', fontWeight: 600 }}>{saveStatus}</span>}
            </div>
          </form>
        </div>

        {/* Panduan Alur Kompetisi */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2>Alur Pengaturan Kompetisi</h2>
            <ol style={{ paddingLeft: '2rem', fontSize: '1.4rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '1rem' }}>
                Tentukan daftar tim peserta pada menu <Link to="/teams" style={{ color: '#6366f1', fontWeight: 600 }}>Kelola Tim</Link>. Tentukan warna identitas khas tiap tim.
              </li>
              <li style={{ marginBottom: '1rem' }}>
                Buat skema babak beserta poin benar/salah pada menu <Link to="/rounds" style={{ color: '#6366f1', fontWeight: 600 }}>Kelola Babak</Link>.
              </li>
              <li style={{ marginBottom: '1rem' }}>
                Jalankan kontrol jalannya kuis/permainan pada menu <Link to="/operator" style={{ color: '#6366f1', fontWeight: 600 }}>Layar Operator</Link>.
              </li>
              <li style={{ marginBottom: '1rem' }}>
                Buka <Link to="/display" target="_blank" rel="noopener noreferrer" style={{ color: '#f43f5e', fontWeight: 600 }}>Layar Display ↗</Link> pada monitor eksternal/proyektor untuk menyajikan hasil skor real-time ke penonton.
              </li>
            </ol>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '1.2rem',
            padding: '2rem',
            border: '0.1rem solid rgba(255,255,255,0.05)',
            fontSize: '1.2rem',
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            {/* Info SVG Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <strong>Informasi Real-Time:</strong> Anda dapat membuka halaman operator di laptop operator, dan membuka layar display di PC proyektor. Semua perubahan skor dan timer akan sinkron secara instan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
