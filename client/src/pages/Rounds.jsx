import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

/**
 * Komponen: Rounds
 * Tujuan: Mengelola data konfigurasi babak (tambah, edit, hapus, atur poin jawaban benar/salah, tipe timer) dengan icon SVG.
 */
export default function Rounds() {
  // State daftar babak
  const [rounds, setRounds] = useState([]);
  
  // State form tambah babak baru
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [timerType, setTimerType] = useState('countdown'); // 'countdown', 'stopwatch', 'none'
  const [pointsCorrect, setPointsCorrect] = useState(100);
  const [pointsWrong, setPointsWrong] = useState(0);

  // State babak yang sedang diedit
  const [editingRound, setEditingRound] = useState(null);
  
  // State form edit babak
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editTimerType, setEditTimerType] = useState('countdown');
  const [editPointsCorrect, setEditPointsCorrect] = useState(100);
  const [editPointsWrong, setEditPointsWrong] = useState(0);

  /**
   * Fungsi: fetchRounds
   * Tujuan: Mengambil konfigurasi babak dari API server backend.
   */
  const fetchRounds = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/rounds');
      const data = await res.json();
      setRounds(data); // Simpan ke state
    } catch (err) {
      console.error('Gagal mengambil data babak:', err);
    }
  };

  // Ambil data babak di awal render
  useEffect(() => {
    fetchRounds();
  }, []);

  /**
   * Fungsi: handleAddRound
   * Parameter: e (Form submit event)
   * Tujuan: Mendaftarkan babak baru beserta parameter poinnnya ke database.
   */
  const handleAddRound = async (e) => {
    e.preventDefault(); // Cegah reload browser
    if (!name.trim()) return; // Validasi nama babak

    try {
      const res = await fetch('http://localhost:5000/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          duration,
          timer_type: timerType,
          points_correct: pointsCorrect,
          points_wrong: pointsWrong
        }) // Kirim payload data babak
      });

      if (res.ok) {
        // Reset input form
        setName('');
        setDescription('');
        setDuration(30);
        setTimerType('countdown');
        setPointsCorrect(100);
        setPointsWrong(0);
        fetchRounds(); // Ambil ulang data
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Babak baru berhasil disimpan!',
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    } catch (err) {
      console.error('Gagal menambah babak:', err);
    }
  };

  /**
   * Fungsi: handleStartEdit
   * Parameter: round (Object babak terpilih)
   * Tujuan: Membuka panel edit dan mempopulasikan field input edit.
   */
  const handleStartEdit = (round) => {
    setEditingRound(round); // Daftarkan babak aktif yang diedit
    setEditName(round.name);
    setEditDescription(round.description || '');
    setEditDuration(round.duration || 30);
    setEditTimerType(round.timer_type || 'countdown');
    setEditPointsCorrect(round.points_correct || 100);
    setEditPointsWrong(round.points_wrong || 0);
  };

  /**
   * Fungsi: handleSaveEdit
   * Parameter: e (Form submit event)
   * Tujuan: Menyimpan perubahan data babak ke API PUT server.
   */
  const handleSaveEdit = async (e) => {
    e.preventDefault(); // Batalkan reload bawaan browser
    if (!editingRound) return;

    try {
      const res = await fetch(`http://localhost:5000/api/rounds/${editingRound.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          duration: editDuration,
          timer_type: editTimerType,
          points_correct: editPointsCorrect,
          points_wrong: editPointsWrong
        }) // Kirim data terupdate
      });

      if (res.ok) {
        setEditingRound(null); // Tutup panel edit
        fetchRounds(); // Ambil ulang data
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Perubahan babak berhasil disimpan!',
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    } catch (err) {
      console.error('Gagal memperbarui babak:', err);
    }
  };

  /**
   * Fungsi: handleDeleteRound
   * Parameter: id (ID babak yang akan dihapus)
   * Tujuan: Menghapus data babak dari database.
   */
  const handleDeleteRound = async (id) => {
    // Validasi konfirmasi hapus babak
    const result = await Swal.fire({
      title: 'Hapus Babak?',
      text: 'Apakah Anda yakin ingin menghapus konfigurasi babak ini?',
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
      const res = await fetch(`http://localhost:5000/api/rounds/${id}`, {
        method: 'DELETE' // Kirim request hapus
      });

      if (res.ok) {
        fetchRounds(); // Segarkan babak
      }
    } catch (err) {
      console.error('Gagal menghapus babak:', err);
    }
  };

  return (
    <div className="app-container">
      <h1>Kelola Babak Pertandingan</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.5rem' }}>
        Konfigurasi skema babak permainan, jenis waktu, serta penyesuaian poin jawaban benar dan salah.
      </p>

      {/* Grid Utama Layout */}
      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(32rem, 1fr))' }}>
        {/* Panel Form Tambah/Edit Babak */}
        <div className="glass-card">
          {!editingRound ? (
            /* Mode Tambah Babak Baru */
            <>
              <h2>Tambah Babak Baru</h2>
              <form onSubmit={handleAddRound}>
                {/* Input Nama Babak */}
                <div className="form-group">
                  <label className="form-label" htmlFor="roundName">Nama Babak</label>
                  <input
                    type="text"
                    id="roundName"
                    className="form-control"
                    placeholder="Contoh: Babak 1: Cepat Tepat"
                    value={name}
                    onChange={(e) => setName(e.target.value)} // Update state
                    required
                  />
                </div>

                {/* Input Deskripsi Babak */}
                <div className="form-group">
                  <label className="form-label" htmlFor="roundDesc">Deskripsi Aturan</label>
                  <textarea
                    id="roundDesc"
                    className="form-control"
                    placeholder="Tulis instruksi/aturan babak di sini..."
                    rows="2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)} // Update state
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Input Tipe Timer */}
                <div className="form-group">
                  <label className="form-label" htmlFor="roundTimerType">Tipe Timer</label>
                  <select
                    id="roundTimerType"
                    className="form-control"
                    value={timerType}
                    onChange={(e) => setTimerType(e.target.value)} // Update state
                    style={{ color: '#ffffff', background: '#1e293b' }}
                  >
                    <option value="countdown">Hitung Mundur (Countdown)</option>
                    <option value="stopwatch">Stopwatch (Hitung Maju)</option>
                    <option value="none">Tanpa Timer</option>
                  </select>
                </div>

                {/* Input Durasi Timer */}
                {timerType !== 'none' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="roundDuration">Durasi Default (Detik)</label>
                    <input
                      type="number"
                      id="roundDuration"
                      className="form-control"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)} // Update state
                      min="1"
                      required
                    />
                  </div>
                )}

                {/* Poin Setup */}
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div className="form-group" style={{ flexGrow: 1 }}>
                    <label className="form-label" htmlFor="pointsCorrect">Benar (+)</label>
                    <input
                      type="number"
                      id="pointsCorrect"
                      className="form-control"
                      value={pointsCorrect}
                      onChange={(e) => setPointsCorrect(parseInt(e.target.value) || 0)} // Update state
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flexGrow: 1 }}>
                    <label className="form-label" htmlFor="pointsWrong">Salah (-)</label>
                    <input
                      type="number"
                      id="pointsWrong"
                      className="form-control"
                      value={pointsWrong}
                      onChange={(e) => setPointsWrong(parseInt(e.target.value) || 0)} // Update state
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                  Simpan Babak
                </button>
              </form>
            </>
          ) : (
            /* Mode Edit Babak Terdaftar */
            <>
              <h2>Edit Babak: {editingRound.name}</h2>
              <form onSubmit={handleSaveEdit}>
                {/* Edit Nama Babak */}
                <div className="form-group">
                  <label className="form-label" htmlFor="editRoundName">Nama Babak</label>
                  <input
                    type="text"
                    id="editRoundName"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)} // Update editName
                    required
                  />
                </div>

                {/* Edit Deskripsi Babak */}
                <div className="form-group">
                  <label className="form-label" htmlFor="editRoundDesc">Deskripsi Aturan</label>
                  <textarea
                    id="editRoundDesc"
                    className="form-control"
                    rows="2"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)} // Update editDescription
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Edit Tipe Timer */}
                <div className="form-group">
                  <label className="form-label" htmlFor="editRoundTimerType">Tipe Timer</label>
                  <select
                    id="editRoundTimerType"
                    className="form-control"
                    value={editTimerType}
                    onChange={(e) => setEditTimerType(e.target.value)} // Update editTimerType
                    style={{ color: '#ffffff', background: '#1e293b' }}
                  >
                    <option value="countdown">Hitung Mundur (Countdown)</option>
                    <option value="stopwatch">Stopwatch (Hitung Maju)</option>
                    <option value="none">Tanpa Timer</option>
                  </select>
                </div>

                {/* Edit Durasi Timer */}
                {editTimerType !== 'none' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="editRoundDuration">Durasi Default (Detik)</label>
                    <input
                      type="number"
                      id="editRoundDuration"
                      className="form-control"
                      value={editDuration}
                      onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)} // Update editDuration
                      min="1"
                      required
                    />
                  </div>
                )}

                {/* Edit Poin Setup */}
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div className="form-group" style={{ flexGrow: 1 }}>
                    <label className="form-label" htmlFor="editPointsCorrect">Benar (+)</label>
                    <input
                      type="number"
                      id="editPointsCorrect"
                      className="form-control"
                      value={editPointsCorrect}
                      onChange={(e) => setEditPointsCorrect(parseInt(e.target.value) || 0)} // Update editPointsCorrect
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flexGrow: 1 }}>
                    <label className="form-label" htmlFor="editPointsWrong">Salah (-)</label>
                    <input
                      type="number"
                      id="editPointsWrong"
                      className="form-control"
                      value={editPointsWrong}
                      onChange={(e) => setEditPointsWrong(parseInt(e.target.value) || 0)} // Update editPointsWrong
                      required
                    />
                  </div>
                </div>

                {/* Tombol Simpan/Batal */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-success" style={{ flexGrow: 1 }}>
                    Simpan
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingRound(null)}>
                    Batal
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Daftar Babak Terdaftar */}
        <div className="glass-card">
          <h2>Daftar Babak ({rounds.length})</h2>
          {rounds.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '4rem 0' }}>
              Belum ada babak terdaftar. Silakan tambahkan babak baru di panel kiri.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {rounds.map((round) => (
                <div key={round.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.6rem', color: '#ffffff' }}>{round.name}</strong>
                      <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        {round.description || 'Tidak ada deskripsi khusus.'}
                      </p>
                    </div>

                    {/* Tombol Aksi Edit & Hapus */}
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.8rem 1.2rem', fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => handleStartEdit(round)}
                      >
                        {/* Edit SVG */}
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
                        onClick={() => handleDeleteRound(round.id)}
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

                  {/* Ringkasan Konfigurasi Aturan Babak */}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    borderTop: '0.1rem solid rgba(255,255,255,0.05)',
                    paddingTop: '1rem',
                    fontSize: '1.2rem'
                  }}>
                    <span style={{
                      background: 'rgba(99,102,241,0.15)',
                      color: '#818cf8',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.6rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {/* Clock SVG */}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Timer: {round.timer_type === 'none' ? 'None' : `${round.duration}s (${round.timer_type})`}</span>
                    </span>
                    <span style={{
                      background: 'rgba(16,185,129,0.15)',
                      color: '#34d399',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.6rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {/* Correct Check SVG */}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>Benar: +{round.points_correct}</span>
                    </span>
                    <span style={{
                      background: 'rgba(239,68,68,0.15)',
                      color: '#f87171',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.6rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {/* Wrong Cross SVG */}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span>Salah: {round.points_wrong}</span>
                    </span>
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
