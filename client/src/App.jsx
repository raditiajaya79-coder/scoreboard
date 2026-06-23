import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Teams from './pages/Teams.jsx';
import Rounds from './pages/Rounds.jsx';
import Operator from './pages/Operator.jsx';
import Display from './pages/Display.jsx';
import TimerDisplay from './pages/TimerDisplay.jsx';

/**
 * Komponen: Navigation
 * Parameter: user (Object user aktif), onLogout (Callback function logout)
 * Tujuan: Merender navigasi utama sistem dengan icon SVG yang konsisten dan minimalis.
 */
function Navigation({ user, onLogout }) {
  // Melacak path URL aktif saat ini untuk styling tautan
  const location = useLocation();

  // Menyembunyikan navigasi di layar display proyektor dan layar login
  if (location.pathname === '/display' || location.pathname === '/login') {
    return null; // Tidak merender apa pun
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand System dengan Trophy Icon SVG */}
        <span className="nav-brand">
          {/* Trophy SVG Icon - Menggantikan Emoji Piala */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#accentGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
            <defs>
              <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
            <path d="M12 2a7 7 0 0 0-7 7c0 3 2.5 5 7 5s7-2 7-5a7 7 0 0 0-7-7z" />
          </svg>
          SCM PRO v1.0
        </span>

        {/* Tautan Navigasi Menu Utama */}
        <div className="nav-links" style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          
          <Link to="/teams" className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}>
            Kelola Tim
          </Link>
          
          <Link to="/rounds" className={`nav-link ${location.pathname === '/rounds' ? 'active' : ''}`}>
            Kelola Babak
          </Link>

          {/* Garis Pemisah (Divider) */}
          <div style={{ width: '0.1rem', height: '2rem', background: 'rgba(255,255,255,0.1)', margin: '0 1.5rem' }}></div>

          {/* Tautan Navigasi Khusus (Aksi Cepat) */}
          <Link to="/operator" className="btn" style={{
            background: location.pathname === '/operator' ? 'linear-gradient(135deg, #4f46e5, #3730a3)' : 'rgba(99, 102, 241, 0.15)',
            border: '0.1rem solid rgba(99, 102, 241, 0.3)',
            color: '#c7d2fe',
            padding: '0.6rem 1.2rem',
            fontSize: '1.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Layar Operator
          </Link>

          <Link to="/display" target="_blank" rel="noopener noreferrer" className="btn" style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '0.1rem solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            padding: '0.6rem 1.2rem',
            fontSize: '1.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>Layar Display ↗</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Profil Operator Aktif */}
      <div className="nav-profile">
        <span className="nav-profile-text">
          Operator: <strong className="nav-profile-name">{user?.username}</strong>
        </span>
        <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '1.2rem' }}>
          Keluar
        </button>
      </div>
    </nav>
  );
}

/**
 * Komponen: App
 * Tujuan: Entry point router client untuk inisialisasi state login dan rute halaman.
 */
export default function App() {
  // Load session dari local storage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('eccs_user'); // Ambil string user
    return savedUser ? JSON.parse(savedUser) : null; // Parse JSON
  });

  // Sinkronkan tema dokumen di awal render
  useEffect(() => {
    const savedTheme = localStorage.getItem('eccs_theme') || 'default'; // Ambil string tema
    document.documentElement.setAttribute('data-theme', savedTheme); // Terapkan atribut DOM
  }, []);

  // Handler Login
  const handleLogin = (userData) => {
    setUser(userData); // Update state user
    localStorage.setItem('eccs_user', JSON.stringify(userData)); // Simpan di storage
  };

  // Handler Logout
  const handleLogout = () => {
    setUser(null); // Reset state
    localStorage.removeItem('eccs_user'); // Hapus data dari storage
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation user={user} onLogout={handleLogout} />
        <div style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/operator" replace /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/teams" element={
              user ? <Teams /> : <Navigate to="/login" replace />
            } />
            <Route path="/rounds" element={
              user ? <Rounds /> : <Navigate to="/login" replace />
            } />
            <Route path="/operator" element={
              user ? <Operator /> : <Navigate to="/login" replace />
            } />
            <Route path="/display" element={<Display />} />
            <Route path="/timer" element={<TimerDisplay />} />
            <Route path="*" element={<Navigate to={user ? "/operator" : "/login"} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
