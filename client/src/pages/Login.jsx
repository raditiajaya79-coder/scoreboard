import React, { useState } from 'react';

/**
 * Komponen: Login
 * Parameter: onLogin (callback function login sukses)
 * Tujuan: Menyajikan antarmuka form masuk dengan desain modern dan visualisasi SVG bersih.
 */
export default function Login({ onLogin }) {
  // State input username
  const [username, setUsername] = useState('');
  // State input password
  const [password, setPassword] = useState('');
  // State penanganan pesan kesalahan login
  const [error, setError] = useState('');
  // State status pemuatan API
  const [loading, setLoading] = useState(false);

  /**
   * Fungsi: handleSubmit
   * Parameter: e (Form submit event)
   * Tujuan: Mengirim data login ke API backend untuk memvalidasi kredensial.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Batalkan reload browser default
    setError(''); // Reset pesan error
    setLoading(true); // Mulai pemuatan

    try {
      // Mengirim POST request ke backend server
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }) // Masukkan payload
      });

      const data = await response.json(); // Parsing json

      if (data.success) {
        onLogin(data.user); // Panggil callback jika login berhasil
      } else {
        setError(data.message || 'Login gagal.'); // Tampilkan pesan gagal
      }
    } catch (err) {
      setError('Koneksi server gagal. Pastikan server.js telah berjalan.'); // Tampilkan kegagalan jaringan
    } finally {
      setLoading(false); // Selesai pemuatan
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' // Radial gradien gelap elegan
    }}>
      <div className="glass-card" style={{
        maxWidth: '42rem',
        width: '100%',
        padding: '5rem 4rem'
      }}>
        {/* Header Visual dengan SVG Trophy Premium */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '8rem',
            height: '8rem',
            borderRadius: '2.4rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
            border: '0.1rem solid rgba(99, 102, 241, 0.25)',
            marginBottom: '2rem',
            boxShadow: '0 0.8rem 2.4rem rgba(99,102,241,0.1)'
          }}>
            {/* Trophy SVG Icon - Pengganti Emoji */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
              <path d="M12 2a7 7 0 0 0-7 7c0 3 2.5 5 7 5s7-2 7-5a7 7 0 0 0-7-7z" />
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: '2.6rem', fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>
            Smart Competition
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', marginTop: '0.6rem' }}>
            Event Competition Control System (ECCS)
          </p>
        </div>

        {/* Pesan Kesalahan dengan SVG Warning */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '0.1rem solid rgba(244, 63, 94, 0.2)',
            borderRadius: '1rem',
            color: '#f87171',
            fontSize: '1.3rem',
            padding: '1.2rem 1.6rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {/* Warning Info SVG Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit}>
          {/* Input Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="loginUsername">Username</label>
            <input
              type="text"
              id="loginUsername"
              className="form-control"
              placeholder="Masukkan username Anda"
              value={username}
              onChange={(e) => setUsername(e.target.value)} // Update state
              required
            />
          </div>

          {/* Input Password */}
          <div className="form-group" style={{ marginBottom: '3.5rem' }}>
            <label className="form-label" htmlFor="loginPassword">Password</label>
            <input
              type="password"
              id="loginPassword"
              className="form-control"
              placeholder="Masukkan password Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Update state
              required
            />
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '1.4rem' }}
            disabled={loading}
          >
            {loading ? 'Memvalidasi Kredensial...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', fontSize: '1.2rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
          Gunakan akun default:<br />
          Username: <strong>operator</strong> & Password: <strong>operator</strong>
        </div>
      </div>
    </div>
  );
}
