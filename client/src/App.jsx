import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
// Login.jsx tidak lagi di-import karena halaman login telah di-bypass (auto-redirect ke /operator)
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

        {/* Tautan Navigasi Menu Utama dengan class CSS responsif */}
        <div className="nav-links" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          
          {/* Tautan untuk mengelola tim */}
          <Link to="/teams" className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}>
            Kelola Tim
          </Link>
          
          {/* Tautan untuk mengelola babak lomba */}
          <Link to="/rounds" className={`nav-link ${location.pathname === '/rounds' ? 'active' : ''}`}>
            Kelola Babak
          </Link>

          {/* Garis Pemisah (Divider) dengan kelas CSS responsif */}
          <div className="nav-divider"></div>

          {/* Tombol Aksi Cepat: Layar Operator — menggunakan class CSS responsif */}
          <Link to="/operator" className="nav-action-btn nav-action-btn--operator" style={{
            background: location.pathname === '/operator' 
              ? 'linear-gradient(135deg, #4f46e5, #3730a3)' /* Gradasi ungu solid saat halaman aktif */
              : 'rgba(99, 102, 241, 0.15)' /* Transparan ungu redup saat tidak aktif */
          }}>
            {/* Ikon pena edit berukuran proporsional */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            <span>Layar Operator</span>
          </Link>

          {/* Tombol Aksi Cepat: Layar Display — menggunakan class CSS responsif */}
          <Link to="/display" target="_blank" rel="noopener noreferrer" className="nav-action-btn nav-action-btn--display">
            {/* Ikon monitor berukuran proporsional */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>Layar Display ↗</span>
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
