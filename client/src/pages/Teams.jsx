import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// Preset warna identitas yang elegan, kontras, dan siap pakai
const PRESET_COLORS = [
  '#f43f5e', // Merah / Rose
  '#f97316', // Oranye
  '#eab308', // Kuning / Yellow
  '#10b981', // Hijau / Emerald
  '#0ea5e9', // Biru Muda / Sky Blue
  '#6366f1', // Indigo / Nila
  '#8b5cf6', // Ungu / Violet
  '#d946ef', // Pink / Fuchsia
];

/**
 * Komponen: Teams
 * Tujuan: Mengelola tim peserta dengan visualisasi SVG modern untuk edit, tambah, dan hapus tim.
 */
export default function Teams() {
  // State daftar tim
  const [teams, setTeams] = useState([]);
  // State input nama tim baru
  const [name, setName] = useState('');
  // State input warna tim baru
  const [color, setColor] = useState('#6366f1');
  // State tim terdaftar yang sedang diedit
  const [editingTeam, setEditingTeam] = useState(null);
  // State input nama tim edit
  const [editName, setEditName] = useState('');
  // State input warna tim edit
  const [editColor, setEditColor] = useState('#6366f1');
  /**
   * Fungsi: fetchTeams
   * Tujuan: Mengambil daftar tim dari API backend.
   */
  const fetchTeams = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teams');
      const data = await res.json();
      setTeams(data); // Simpan ke state
    } catch (err) {
      console.error('Gagal mengambil daftar tim:', err);
    }
  };

  // Panggil fetchTeams saat mounting
  useEffect(() => {
    fetchTeams();
  }, []);

  /**
   * Fungsi: handleAddTeam
   * Parameter: e (Form submit event)
   * Tujuan: Menyimpan pendaftaran tim baru ke server API.
   */
  const handleAddTeam = async (e) => {
    e.preventDefault(); // Batalkan reload bawaan browser
    if (!name.trim()) return; // Validasi nama tidak kosong

    try {
      const res = await fetch('http://localhost:5000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }) // Kirim payload nama dan warna
      });

      if (res.ok) {
        setName(''); // Reset input nama
        setColor('#6366f1'); // Reset input warna
        fetchTeams(); // Refresh data
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Tim berhasil didaftarkan!',
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    } catch (err) {
      console.error('Gagal mendaftarkan tim baru:', err);
    }
  };

  /**
   * Fungsi: handleStartEdit
   * Parameter: team (Object data tim)
   * Tujuan: Mengisi form edit dengan informasi tim terpilih.
   */
  const handleStartEdit = (team) => {
    setEditingTeam(team); // Daftarkan tim aktif yang diedit
    setEditName(team.name);
    setEditColor(team.color || '#6366f1');
    setEditScore(team.score || 0);
  };

  /**
   * Fungsi: handleSaveEdit
   * Parameter: e (Form submit event)
   * Tujuan: Menyimpan perubahan nama, warna, dan skor tim ke server API.
   */
  const handleSaveEdit = async (e) => {
    e.preventDefault(); // Batalkan reload bawaan browser
    if (!editingTeam) return;

    try {
      const res = await fetch(`http://localhost:5000/api/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, color: editColor, score: editScore }) // Kirim payload edit
      });

      if (res.ok) {
        setEditingTeam(null); // Keluar dari mode edit
        fetchTeams(); // Refresh data
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Perubahan berhasil disimpan!',
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    } catch (err) {
      console.error('Gagal menyimpan perubahan data tim:', err);
    }
  };

  /**
   * Fungsi: handleDeleteTeam
   * Parameter: id (ID tim yang akan dihapus)
   * Tujuan: Menghapus tim dari database melalui API DELETE.
   */
  const handleDeleteTeam = async (id) => {
    // Validasi konfirmasi hapus tim
    const result = await Swal.fire({
      title: 'Hapus Tim?',
      text: 'Apakah Anda yakin ingin menghapus tim ini beserta semua histori skornya?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f8fafc',
      customClass: { popup: 'glass-card' }
    });

    if (!result.isConfirmed) {
      return; // Batalkan
    }

    try {
      const res = await fetch(`http://localhost:5000/api/teams/${id}`, {
        method: 'DELETE' // Kirim request hapus
      });

      if (res.ok) {
        fetchData(); // Segarkan data tim
      }
    } catch (err) {
      console.error('Gagal menghapus data tim:', err);
    }
  };

  return (
    <div className="app-container">
      <h1>Kelola Tim Peserta</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.5rem' }}>
        Daftarkan tim peserta dan tentukan skema warna unik mereka untuk visualisasi papan skor.
      </p>

      {/* Grid Utama (Kiri: Form Tambah/Edit, Kanan: Daftar Tim) */}
      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(32rem, 1fr))' }}>
        {/* Form Input/Edit Tim */}
        <div className="glass-card">
          {!editingTeam ? (
            /* Mode Tambah Tim Baru */
            <>
              <h2>Tambah Tim Baru</h2>
              <form onSubmit={handleAddTeam}>
                {/* Input Nama Tim */}
                <div className="form-group">
                  <label className="form-label" htmlFor="newTeamName">Nama Tim</label>
                  <input
                    type="text"
                    id="newTeamName"
                    className="form-control"
                    placeholder="Contoh: Garuda"
                    value={name}
                    onChange={(e) => setName(e.target.value)} // Update state
                    required
                  />
                </div>

                {/* Pilihan Preset Warna Tim */}
                <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                  <label className="form-label">Warna Identitas Tim</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {PRESET_COLORS.map(c => (
                      <div
                        key={c}
                        onClick={() => setColor(c)}
                        style={{
                          width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
                          border: color === c ? '0.3rem solid #ffffff' : '0.3rem solid rgba(255,255,255,0.1)',
                          boxShadow: color === c ? `0 0 1.5rem ${c}` : 'none',
                          transition: 'all 0.2s ease',
                          transform: color === c ? 'scale(1.15)' : 'scale(1)'
                        }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Daftarkan Tim
                </button>
              </form>
            </>
          ) : (
            /* Mode Edit Tim Terdaftar */
            <>
              <h2>Edit Tim: {editingTeam.name}</h2>
              <form onSubmit={handleSaveEdit}>
                {/* Edit Nama Tim */}
                <div className="form-group">
                  <label className="form-label" htmlFor="editTeamName">Nama Tim</label>
                  <input
                    type="text"
                    id="editTeamName"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)} // Update editName
                    required
                  />
                </div>

                {/* Edit Skor Tim */}
                <div className="form-group">
                  <label className="form-label" htmlFor="editTeamScore">Skor Kumulatif</label>
                  <input
                    type="number"
                    id="editTeamScore"
                    className="form-control"
                    value={editScore}
                    onChange={(e) => setEditScore(parseInt(e.target.value) || 0)} // Update editScore
                    required
                  />
                </div>

                {/* Pilihan Preset Warna Tim Edit */}
                <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                  <label className="form-label">Warna Identitas Tim</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {PRESET_COLORS.map(c => (
                      <div
                        key={c}
                        onClick={() => setEditColor(c)}
                        style={{
                          width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
                          border: editColor === c ? '0.3rem solid #ffffff' : '0.3rem solid rgba(255,255,255,0.1)',
                          boxShadow: editColor === c ? `0 0 1.5rem ${c}` : 'none',
                          transition: 'all 0.2s ease',
                          transform: editColor === c ? 'scale(1.15)' : 'scale(1)'
                        }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Tombol Simpan & Batal */}
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <button type="submit" className="btn btn-success" style={{ flexGrow: 1 }}>
                    Simpan
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingTeam(null)}>
                    Batal
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Daftar Tim Terdaftar */}
        <div className="glass-card">
          <h2>Daftar Peserta ({teams.length})</h2>
          {teams.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '4rem 0' }}>
              Belum ada tim terdaftar. Silakan tambahkan tim baru di panel kiri.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {teams.map((team, index) => (
                <div key={team.id} className="list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Indikator Bulat Warna Tim */}
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: team.color,
                      boxShadow: `0 0 1.2rem ${team.color}77`
                    }} />
                    
                    <div>
                      <strong style={{ fontSize: '1.6rem', color: '#ffffff' }}>
                        Rank #{index + 1} | {team.name}
                      </strong>
                      <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                        Skor Saat Ini: <strong style={{ color: team.color }}>{team.score} Poin</strong>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Edit & Hapus dengan Icon SVG */}
                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.8rem 1.2rem', fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => handleStartEdit(team)}
                    >
                      {/* Pencil/Edit SVG */}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{
                        padding: '0.8rem 1.2rem',
                        fontSize: '1.2rem',
                        background: 'transparent',
                        border: '0.1rem solid rgba(244,63,94,0.3)',
                        color: '#f87171',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      {/* Trash SVG */}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
