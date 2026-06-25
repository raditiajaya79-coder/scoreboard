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
 * Parameter: user (Object user aktif)
 * Tujuan: Merender navigasi utama sistem dengan icon SVG yang konsisten dan minimalis.
 */
function Navigation({ user }) {
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

    </nav>
  );
}

/**
 * Komponen: App
 * Tujuan: Entry point router client untuk inisialisasi state login dan rute halaman.
 */
export default function App() {
  // Mengatur status user secara bawaan (default) sebagai operator agar langsung masuk tanpa login
  const [user, setUser] = useState({ username: 'operator' });

  // Sinkronkan tema dokumen di awal render
  useEffect(() => {
    // Mengambil tema tersimpan dari local storage
    const savedTheme = localStorage.getItem('eccs_theme') || 'default';
    // Menerapkan tema terpilih ke elemen dokumen root
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    // Router Pembungkus Utama Aplikasi
    <Router>
      {/* Kontainer Utama Flexbox Vertikal */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Navigasi Utama Aplikasi */}
        <Navigation user={user} />
        {/* Kontainer Halaman Utama */}
        <div style={{ flexGrow: 1 }}>
          <Routes>
            {/* Rute Login: Dialihkan otomatis ke halaman operator */}
            <Route path="/login" element={<Navigate to="/operator" replace />} />
            {/* Rute Kelola Tim */}
            <Route path="/teams" element={<Teams />} />
            {/* Rute Kelola Babak */}
            <Route path="/rounds" element={<Rounds />} />
            {/* Rute Utama Layar Kontrol Operator */}
            <Route path="/operator" element={<Operator />} />
            {/* Rute Layar Tampilan Proyektor */}
            <Route path="/display" element={<Display />} />
            {/* Rute Layar Countdown Timer */}
            <Route path="/timer" element={<TimerDisplay />} />
            {/* Fallback Rute Tidak Dikenal: Dialihkan ke operator */}
            <Route path="*" element={<Navigate to="/operator" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
