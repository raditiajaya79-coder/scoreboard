import React, { useState, useEffect } from 'react';

/**
 * Komponen: Logs
 * Tujuan: Menyajikan riwayat lengkap aktivitas penambahan dan pengurangan nilai secara mendetail
 * dengan menggunakan icon SVG yang bersih dan konsisten.
 */
export default function Logs() {
  // State untuk menyimpan daftar seluruh log aktivitas
  const [logs, setLogs] = useState([]);
  // State untuk melacak status pemuatan data
  const [loading, setLoading] = useState(true);

  /**
   * Fungsi: fetchLogs
   * Tujuan: Mengambil data histori log dari API backend.
   */
  const fetchLogs = async () => {
    try {
      setLoading(true); // Mulai pemuatan
      const res = await fetch('http://localhost:5000/api/logs'); // Request log ke backend
      const data = await res.json(); // Parsing json
      setLogs(data); // Simpan ke state
    } catch (err) {
      console.error('Gagal memuat histori log:', err);
    } finally {
      setLoading(false); // Selesai pemuatan
    }
  };

  // Ambil log sekali saat pertama kali masuk ke halaman
  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="app-container">
      <h1>Riwayat Pertandingan</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.5rem' }}>
        Log aktivitas mutasi skor tim dicatat secara otomatis untuk transparansi dan audit juri.
      </p>

      {/* Card pembungkus tabel log */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <h2>Mutasi Skor Terbaru</h2>
          {/* Tombol Refresh Manual */}
          <button className="btn btn-secondary" onClick={fetchLogs} style={{ padding: '0.8rem 1.6rem', fontSize: '1.3rem' }}>
            {/* Refresh/Rotate-cw SVG Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Segarkan Log</span>
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
            Memuat data histori...
          </p>
        ) : logs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
            Belum ada aktivitas mutasi skor terdaftar pada event ini.
          </p>
        ) : (
          /* Pembungkus Tabel Responsif */
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '1.4rem',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '0.1rem solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1.2rem' }}>Waktu</th>
                  <th style={{ padding: '1.2rem' }}>Babak</th>
                  <th style={{ padding: '1.2rem' }}>Nama Tim</th>
                  <th style={{ padding: '1.2rem' }}>Perubahan</th>
                  <th style={{ padding: '1.2rem' }}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {/* Iterasi data log */}
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '0.1rem solid rgba(255,255,255,0.04)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Kolom Waktu */}
                    <td style={{ padding: '1.5rem 1.2rem', color: 'var(--text-secondary)' }}>
                      {log.timestamp}
                    </td>
                    
                    {/* Kolom Nama Babak */}
                    <td style={{ padding: '1.5rem 1.2rem', fontWeight: 500 }}>
                      {log.round_name}
                    </td>
                    
                    {/* Kolom Nama Tim */}
                    <td style={{ padding: '1.5rem 1.2rem', color: '#ffffff', fontWeight: 600 }}>
                      {log.team_name}
                    </td>
                    
                    {/* Kolom Angka Perubahan */}
                    <td style={{
                      padding: '1.5rem 1.2rem',
                      fontWeight: 700,
                      color: log.change_value >= 0 ? '#34d399' : '#f87171' // Hijau jika plus, merah jika minus
                    }}>
                      {log.change_value >= 0 ? `+${log.change_value}` : log.change_value}
                    </td>
                    
                    {/* Kolom Keterangan Detail */}
                    <td style={{ padding: '1.5rem 1.2rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
