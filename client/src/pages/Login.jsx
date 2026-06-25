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
    // Kontainer pembungkus utama seluruh halaman login dengan radial gradien gelap
    <div style={{
      display: 'flex', // Menggunakan Flexbox untuk perataan tengah card login
      justifyContent: 'center', // Meratakan card secara horizontal di tengah layar
      alignItems: 'center', // Meratakan card secara vertikal di tengah layar
      minHeight: '100vh', // Mengisi tinggi layar minimal 100% tinggi viewport
      padding: '2rem', // Memberikan ruang batas aman agar card tidak menyentuh tepi layar di perangkat kecil
      background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)', // Gradien radial gelap bertema malam cyber
      boxSizing: 'border-box' // Memastikan padding dihitung di dalam total dimensi lebar/tinggi kontainer
    }}>
      {/* Card Utama Glassmorphism bertema Landscape / Persegi Panjang Menyamping */}
      <div className="glass-card" style={{
        maxWidth: '85rem', // Memperlebar batas maksimal card untuk menampung dua kolom berdampingan
        width: '100%', // Lebar fleksibel 100% mengikuti kontainer luar hingga mencapai batas maxWidth
        padding: 0, // Padding dinonaktifkan di sini karena diatur terpisah per kolom secara presisi
        display: 'grid', // Menggunakan CSS Grid untuk memisahkan kolom kiri dan kanan
        gridTemplateColumns: 'repeat(auto-fit, minmax(36rem, 1fr))', // Membuat kolom responsif: berjejer landscape pada desktop dan bertumpuk portrait pada layar sempit/mobile
        overflow: 'hidden', // Memastikan efek border-radius memotong konten di dalam agar rapi
        border: '0.15rem solid rgba(255, 255, 255, 0.08)', // Batas garis tipis mengkilap gaya glassmorphism
        boxShadow: '0 2.5rem 5rem rgba(0, 0, 0, 0.4)' // Bayangan lembut untuk efek melayang tiga dimensi
      }}>
        {/* Kolom Kiri: Bagian Branding, Logo, dan Informasi Default Kredensial */}
        <div style={{
          padding: '5rem 4rem', // Jeda ruang dalam kolom kiri
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)', // Latar belakang gradien kaca gelap pekat khusus branding
          borderRight: '0.1rem solid rgba(255, 255, 255, 0.05)', // Garis vertikal tipis pembatas antarkolom
          display: 'flex', // Penataan fleksibel dalam susunan vertikal
          flexDirection: 'column', // Mengatur elemen-elemen di dalamnya bertumpuk ke bawah
          alignItems: 'center', // Meratakan elemen di tengah secara horizontal
          justifyContent: 'center', // Meratakan elemen di tengah secara vertikal
          textAlign: 'center' // Mengatur semua teks di dalamnya rata tengah
        }}>
          {/* Badge Lingkaran Penampung Logo Trophy */}
          <div style={{
            display: 'inline-flex', // Mengatur ukuran pembungkus agar mengikuti ikon di dalamnya
            alignItems: 'center', // Penjajaran ikon secara vertikal
            justifyContent: 'center', // Penjajaran ikon secara horizontal
            width: '9rem', // Lebar lingkaran badge
            height: '9rem', // Tinggi lingkaran badge
            borderRadius: '2.8rem', // Kelengkungan sudut badge mirip icon iOS premium
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', // Gradasi pendaran ungu ke cyan transparan
            border: '0.15rem solid rgba(99, 102, 241, 0.3)', // Garis pembatas neon biru transparan
            marginBottom: '2.5rem', // Jarak bawah badge ke judul
            boxShadow: '0 1rem 3rem rgba(99, 102, 241, 0.15)', // Pendaran cahaya di belakang logo
          }}>
            {/* Logo SCM Premium: Desain perisai cyber yang membingkai piala modern dengan bintang emas di tengah */}
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Gradasi warna logo utama (ungu ke cyan khas aplikasi ECCS) */}
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                {/* Gradasi warna bintang emas/gold premium */}
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              {/* Jalur perisai pelindung luar yang melambangkan kompetisi olahraga/akademik terpercaya */}
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Badan utama cawan piala berwarna putih bersih */}
              <path d="M12 17V14M12 14C14.2091 14 16 12.2091 16 10V6H8V10C8 12.2091 9.79086 14 12 14Z" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              {/* Pegangan telinga piala bagian kiri yang geometris */}
              <path d="M8 7H6V9C6 10.1 6.9 11 8 11" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Pegangan telinga piala bagian kanan yang geometris */}
              <path d="M16 7H18V9C18 10.1 17.1 11 16 11" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Dudukan piala tingkat satu */}
              <path d="M9 17H15" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              {/* Alas piala tingkat dua paling bawah */}
              <path d="M8 19H16" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
              {/* Simbol bintang kejayaan emas yang bersinar di tengah-tengah piala */}
              <path d="M12 8L12.75 9.25L14 10L12.75 10.75L12 12L11.25 10.75L10 10L11.25 9.25L12 8Z" fill="url(#goldGrad)" />
            </svg>
          </div>
          
          {/* Judul Utama Sistem */}
          <h2 style={{ 
            margin: 0, // Menghilangkan margin bawaan tag heading
            fontSize: 'clamp(2.4rem, 4vw, 3rem)', // Ukuran font dinamis agar membesar/mengecil mengikuti lebar layar
            fontFamily: 'var(--font-outfit)', // Font premium Outfit
            fontWeight: 900, // Ketebalan ekstra tebal
            letterSpacing: '-0.02em', // Merapatkan huruf agar berkarakter premium
            background: 'linear-gradient(135deg, #ffffff 50%, #94a3b8 100%)', // Efek logam gradasi perak pada judul
            WebkitBackgroundClip: 'text', // Memotong klip latar agar hanya mewarnai teks judul
            WebkitTextFillColor: 'transparent' // Membuat warna asli teks transparan agar gradasi terlihat
          }}>
            Smart Competition
          </h2>
          
          {/* Subtitle / Deskripsi Kepanjangan SCM */}
          <p style={{ 
            color: 'var(--text-secondary)', // Warna teks abu-abu sekunder yang redup
            fontSize: '1.4rem', // Ukuran huruf deskripsi
            marginTop: '0.8rem', // Jarak atas ke judul utama
            lineHeight: 1.6, // Jarak baris teks agar nyaman dibaca
            maxWidth: '28rem' // Membatasi lebar teks agar rapi dalam baris bertumpuk
          }}>
            Event Competition Control System (ECCS)
          </p>

          {/* Kotak Informasi Kredensial Akun Default - Desain Premium */}
          <div style={{ 
            marginTop: '4rem', // Jarak atas kotak ke deskripsi
            padding: '1.8rem 2rem', // Spasi dalam kotak informasi
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 100%)', // Gradasi latar belakang sangat transparan
            borderRadius: '1.8rem', // Kelengkungan sudut kotak lebih bulat premium
            border: '0.1rem solid rgba(255, 255, 255, 0.06)', // Garis tipis pembatas luar kotak
            width: '100%', // Mengisi lebar penuh kolom kiri
            boxSizing: 'border-box', // Pengukuran box aman
            display: 'flex', // Menyusun secara flex
            flexDirection: 'column', // Arah susunan vertikal ke bawah
            gap: '1.2rem', // Jarak antar baris elemen di dalamnya
            alignItems: 'center' // Meratakan elemen di tengah secara horizontal
          }}>
            {/* Header Kredensial dengan Ikon Kunci */}
            <div style={{
              display: 'flex', // Penataan baris sejajar
              alignItems: 'center', // Rata tengah vertikal
              gap: '0.8rem', // Jarak antara ikon kunci dengan judul teks
              fontSize: '1.1rem', // Ukuran huruf kecil
              fontWeight: 700, // Tebal tebal
              color: 'var(--text-secondary)', // Warna redup
              textTransform: 'uppercase', // Huruf kapital semua
              letterSpacing: '0.08em' // Jarak antar huruf diperlebar
            }}>
              {/* Key Icon SVG */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              <span>Kredensial Akses Cepat</span>
            </div>

            {/* Kontainer Pill Username & Password */}
            <div style={{
              display: 'flex', // Penataan mendatar
              gap: '1rem', // Jarak antar pill
              width: '100%', // Lebar penuh kontainer
              justifyContent: 'center', // Rata tengah
              flexWrap: 'wrap' // Membungkus otomatis jika ruang tidak cukup
            }}>
              {/* Pill Username */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)', // Warna latar belakang ungu transparan lembut
                border: '0.1rem solid rgba(99, 102, 241, 0.15)', // Border ungu tipis
                padding: '0.6rem 1.4rem', // Ukuran spasi dalam pill
                borderRadius: '1rem', // Sudut tumpul pill
                fontSize: '1.2rem', // Ukuran teks pill
                color: '#cbd5e1', // Warna teks abu-abu cerah
                display: 'flex', // Flexbox sejajar
                gap: '0.5rem' // Jarak antara teks label dengan isi value
              }}>
                <span style={{ color: '#818cf8', fontWeight: 500 }}>U:</span>
                <strong style={{ color: '#ffffff' }}>operator</strong>
              </div>

              {/* Pill Password */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.08)', // Latar belakang cyan transparan lembut
                border: '0.1rem solid rgba(6, 182, 212, 0.15)', // Border cyan tipis
                padding: '0.6rem 1.4rem', // Spasi dalam pill
                borderRadius: '1rem', // Sudut tumpul pill
                fontSize: '1.2rem', // Ukuran teks pill
                color: '#cbd5e1', // Warna teks abu-abu cerah
                display: 'flex', // Flexbox sejajar
                gap: '0.5rem' // Jarak teks
              }}>
                <span style={{ color: '#22d3ee', fontWeight: 500 }}>P:</span>
                <strong style={{ color: '#ffffff' }}>operator</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Bagian Formulir Login & Penanganan Pesan Error */}
        <div style={{
          padding: '5rem 4rem', // Jeda ruang dalam kolom kanan
          background: 'rgba(15, 23, 42, 0.4)', // Latar belakang transparan gelap kontras dengan kolom kiri
          display: 'flex', // Menggunakan Flexbox untuk perataan form
          flexDirection: 'column', // Menyusun elemen di dalamnya bertumpuk ke bawah
          justifyContent: 'center' // Meratakan isi kolom di tengah secara vertikal
        }}>
          {/* Judul Formulir */}
          <h3 style={{
            margin: '0 0 3rem 0', // Jarak bawah judul ke field input pertama
            fontSize: '2rem', // Ukuran font judul form
            fontFamily: 'var(--font-outfit)', // Menggunakan font Outfit
            fontWeight: 700, // Tebal sedang
            color: '#f8fafc' // Warna putih bersih
          }}>
            Masuk ke Akun
          </h3>

          {/* Alert Kesalahan Login (Hanya dirender jika ada pesan error dari API) */}
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)', // Latar belakang merah transparan tanda bahaya
              border: '0.1rem solid rgba(244, 63, 94, 0.2)', // Garis pembatas merah tegas
              borderRadius: '1.2rem', // Sudut tumpul melengkung
              color: '#f87171', // Warna teks merah muda menyala
              fontSize: '1.3rem', // Ukuran font pesan error
              padding: '1.4rem 1.8rem', // Spasi dalam kotak alert
              marginBottom: '2.5rem', // Jarak bawah alert ke formulir
              display: 'flex', // Penataan horizontal sejajar
              alignItems: 'center', // Ikon & teks rata tengah vertikal
              gap: '1rem', // Jarak spasi antara ikon warning dengan pesan teks
              animation: 'shake 0.4s ease-in-out' // Animasi goyang saat pesan kesalahan dipicu
            }}>
              {/* Warning Info SVG Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {/* Teks Pesan Error */}
              <span>{error}</span>
            </div>
          )}

          {/* Formulir Pengiriman Login */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* Input Group: Username */}
            <div className="form-group" style={{ marginBottom: '2.2rem' }}>
              {/* Label Username */}
              <label className="form-label" htmlFor="loginUsername" style={{ fontSize: '1.2rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
              {/* Input Field: Username */}
              <input
                type="text"
                id="loginUsername"
                className="form-control"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)} // Memperbarui state lokal
                required // Wajib diisi sebelum dikirim
                style={{
                  height: '4.8rem', // Tinggi field input yang proporsional dan mudah diklik
                  fontSize: '1.4rem', // Ukuran teks input
                  borderRadius: '1.2rem', // Kelengkungan sudut input modern
                  background: 'rgba(15, 23, 42, 0.6)', // Background input abu gelap transparan
                  border: '0.15rem solid rgba(255,255,255,0.08)', // Border tipis menyatu dengan glassmorphism
                  color: '#ffffff', // Warna teks ketikan putih
                  boxSizing: 'border-box' // Pengukuran box aman
                }}
              />
            </div>

            {/* Input Group: Password */}
            <div className="form-group" style={{ marginBottom: '4rem' }}>
              {/* Label Password */}
              <label className="form-label" htmlFor="loginPassword" style={{ fontSize: '1.2rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              {/* Input Field: Password */}
              <input
                type="password"
                id="loginPassword"
                className="form-control"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Memperbarui state lokal
                required // Wajib diisi sebelum dikirim
                style={{
                  height: '4.8rem', // Tinggi field input yang proporsional
                  fontSize: '1.4rem', // Ukuran teks password
                  borderRadius: '1.2rem', // Kelengkungan sudut input
                  background: 'rgba(15, 23, 42, 0.6)', // Background abu gelap transparan
                  border: '0.15rem solid rgba(255,255,255,0.08)', // Border tipis
                  color: '#ffffff', // Warna teks password
                  boxSizing: 'border-box' // Pengukuran box aman
                }}
              />
            </div>

            {/* Tombol Pemicu Pengiriman Form */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ 
                width: '100%', // Mengisi lebar penuh form
                height: '5rem', // Tinggi tombol premium yang kokoh
                fontSize: '1.5rem', // Ukuran font tombol
                fontWeight: 700, // Ketebalan tombol berani
                borderRadius: '1.4rem', // Kelengkungan sudut tombol
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', // Gradien gradasi biru indigo ke cyan
                border: 'none', // Menghilangkan border default
                boxShadow: '0 0.8rem 2rem rgba(99, 102, 241, 0.3)', // Bayangan pendaran neon di bawah tombol
                display: 'flex', // Penataan sejajar
                alignItems: 'center', // Ikon & teks rata tengah vertikal
                justifyContent: 'center', // Ikon & teks rata tengah horizontal
                gap: '1rem', // Jarak antara teks masuk dan spinner loading
                cursor: 'pointer' // Merubah kursor menjadi telunjuk saat didekati mouse
              }}
              disabled={loading} // Menolak klik ganda saat proses validasi sedang berjalan
            >
              {/* Pengambilan keputusan visual: Tampilkan loader jika sedang memproses API */}
              {loading ? (
                <>
                  {/* Lingkaran Spinner Putar */}
                  <span className="spinner" style={{
                    width: '1.8rem',
                    height: '1.8rem',
                    border: '0.2rem solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite' // Animasi rotasi berputar stabil
                  }}></span>
                  <span>Memvalidasi...</span>
                </>
              ) : (
                <span>Masuk ke Sistem</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Penyuntikan Keyframes CSS Khusus untuk Rotasi Spinner dan Getaran Shake Alert */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-0.5rem); }
          75% { transform: translateX(0.5rem); }
        }
      `}</style>
    </div>
  );
}
