import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
// react-router-dom Link tidak diperlukan di halaman display proyektor
import { io } from 'socket.io-client';
import logoUrl from '../../images/kediri-technopark-logo.png';

/**
 * Komponen: BrandingLogo
 * Deskripsi: Komponen independen untuk menampilkan logo Kediri Technopark di sudut kanan atas layar tanpa teks "Powered by".
 *            Dibuat terpisah agar tata letak logo terisolasi dan mudah dikelola secara modular.
 */
const BrandingLogo = () => {
  // Mengembalikan elemen visual logo dalam struktur DOM React
  return (
    // Kontainer penampung logo menggunakan class CSS eksternal responsif
    <div className="display-branding-logo">
      {/* Gambar logo Kediri Technopark */}
      <img 
        src={logoUrl} // Menghubungkan sumber gambar dengan berkas logo Kediri Technopark yang telah diimpor
        alt="Kediri Technopark Logo" // Menyediakan teks alternatif untuk kebutuhan aksesibilitas pembaca layar (screen reader)
      />
    </div>
  );
};

// ==========================================
// KUMPULAN LOGIKA AUDIO WEB AUDIO API (SYNTHESIZER)
// ==========================================

// Konteks audio global tunggal yang digunakan kembali untuk mencegah batas maksimal AudioContext browser terlampaui
let globalAudioCtx = null;

/**
 * Fungsi: getAudioContext
 * Deskripsi: Mengembalikan satu-satunya instance AudioContext yang aktif (singleton).
 *            Mengaktifkan kembali (resume) jika ditangguhkan oleh browser.
 */
const getAudioContext = () => {
  // Jika konteks audio belum dibuat, inisialisasi baru
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Aktifkan kembali konteks audio jika dalam keadaan tersuspensi (kebijakan autoplay browser)
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  // Mengembalikan instance konteks audio
  return globalAudioCtx;
};

// Fungsi pembantu global untuk mendapatkan ambang batas waktu kritis (danger threshold) secara dinamis
const getDangerThreshold = (maxVal) => {
  // Jika durasi maksimal 60 detik atau lebih (misal 60s, 90s, dst), ambang kritisnya adalah 10 detik terakhir
  if (maxVal >= 60) return 10;
  // Jika durasi maksimal di atas 30 detik tetapi di bawah 60, ambang kritisnya adalah 8 detik terakhir
  if (maxVal >= 30) return 8;
  // Jika durasi maksimal di atas 15 detik tetapi di bawah 30, ambang kritisnya adalah 5 detik terakhir
  if (maxVal >= 15) return 5;
  // Untuk waktu yang sangat pendek (di bawah 15 detik), ambang kritisnya adalah 3 detik terakhir
  return 3;
};

/**
 * Fungsi: playScoreAddSound
 * Deskripsi: Memicu bunyi lonceng naik (Chime chord C Major) dengan volume yang lebih kencang (0.45) agar lebih terdengar jelas.
 */
const playScoreAddSound = () => {
  try {
    // Mendapatkan konteks audio tunggal
    const ctx = getAudioContext();
    // Mendapatkan stempel waktu saat ini dari konteks audio
    const now = ctx.currentTime;
    // Nada-nada yang membentuk chord major C (C5 = 523.25Hz, E5 = 659.25Hz, G5 = 783.99Hz)
    const notes = [523.25, 659.25, 783.99];
    
    // Looping untuk menjadwalkan setiap nada dengan jeda arpeggio 180ms
    notes.forEach((freq, idx) => {
      // Membuat oscillator generator gelombang suara
      const osc = ctx.createOscillator();
      // Mengatur jenis gelombang ke sinus (sine) agar berbunyi jernih lembut seperti bel
      osc.type = 'sine';
      // Menyetel frekuensi nada dengan jeda arpeggio 180ms antar nada
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);
      
      // Membuat pengatur volume gain node
      const gainNode = ctx.createGain();
      // Menginisialisasi volume dari nol sebelum nada berbunyi
      gainNode.gain.setValueAtTime(0, now + idx * 0.18);
      // Volume dinaikkan ke tingkat yang lebih kencang (0.45) dalam waktu 30ms
      gainNode.gain.linearRampToValueAtTime(0.45, now + idx * 0.18 + 0.03);
      // Meluruhkan volume secara eksponensial hingga sunyi dalam waktu 450ms
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.45);
      
      // Menghubungkan output osilator ke pengatur volume
      osc.connect(gainNode);
      // Menghubungkan pengatur volume ke speaker output
      gainNode.connect(ctx.destination);
      
      // Menjalankan nada secara terjadwal
      osc.start(now + idx * 0.18);
      // Menghentikan nada secara terjadwal
      osc.stop(now + idx * 0.18 + 0.5);
    });
  } catch (e) {
    // Menangani error jika audio gagal dijalankan
    console.error('Gagal memainkan audio tambah skor:', e);
  }
};

/**
 * Fungsi: playScoreSubSound
 * Deskripsi: Memicu bunyi dengung sekuensial dua nada (tett-tott) dengan volume yang lebih mantap dan kencang (0.50).
 */
const playScoreSubSound = () => {
  try {
    // Mendapatkan konteks audio tunggal
    const ctx = getAudioContext();
    // Mendapatkan stempel waktu saat ini
    const now = ctx.currentTime;
    
    // --- Nada Pertama ("tett") ---
    // Membuat oscillator untuk nada pertama
    const osc1 = ctx.createOscillator();
    // Membuat gain node untuk volume nada pertama
    const g1 = ctx.createGain();
    
    // Tipe gelombang gigi gergaji (sawtooth) agar berdengung tajam
    osc1.type = 'sawtooth';
    // Nada pertama berada pada frekuensi 160Hz
    osc1.frequency.setValueAtTime(160, now);
    
    // Mengatur volume mulai dari nol agar tidak ada letupan audio
    g1.gain.setValueAtTime(0, now);
    // Terdengar lebih kencang (0.50) dalam waktu 20ms
    g1.gain.linearRampToValueAtTime(0.50, now + 0.02);
    // Meluruhkan volume secara eksponensial dalam waktu 230ms (tett yang lebih mantap)
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    // Menghubungkan osc1 ke volume, dan volume ke speaker
    osc1.connect(g1);
    g1.connect(ctx.destination);
    
    // Memulai nada pertama instan
    osc1.start(now);
    // Menghentikan nada pertama setelah 260ms
    osc1.stop(now + 0.26);

    // --- Nada Kedua ("tott") ---
    // Membuat oscillator untuk nada kedua
    const osc2 = ctx.createOscillator();
    // Membuat gain node untuk volume nada kedua
    const g2 = ctx.createGain();
    
    // Menggunakan gelombang gigi gergaji agar tekstur suaranya seragam
    osc2.type = 'sawtooth';
    // Nada kedua berada pada frekuensi lebih rendah (110Hz) dimulai setelah 280ms jeda (tempo diperlambat)
    osc2.frequency.setValueAtTime(110, now + 0.28);
    
    // Volume dimulai dari nol saat nada kedua mulai berbunyi (pada detik ke-0.28)
    g2.gain.setValueAtTime(0, now + 0.28);
    // Terdengar lebih kencang (0.50) dalam waktu 20ms setelah dimulai
    g2.gain.linearRampToValueAtTime(0.50, now + 0.28 + 0.02);
    // Meluruhkan volume secara eksponensial selama 330ms hingga sunyi
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.28 + 0.35);
    
    // Menghubungkan osc2 ke volume, dan volume ke speaker
    osc2.connect(g2);
    g2.connect(ctx.destination);
    
    // Memulai nada kedua setelah jeda 280ms
    osc2.start(now + 0.28);
    // Menghentikan nada kedua setelah selesai berbunyi
    osc2.stop(now + 0.28 + 0.37);
  } catch (e) {
    // Menangani error jika audio gagal dijalankan
    console.error('Gagal memainkan audio kurang skor:', e);
  }
};

/**
 * Fungsi: playStandingsWhooshSound
 * Deskripsi: Memicu suara backsound klasemen yang bersemangat tinggi (tidak letoy).
 *            Memadukan dampak kick boom menghentak di awal dengan synthesizer brass swell yang menyapu naik.
 */
const playStandingsWhooshSound = () => {
  try {
    // Mendapatkan konteks audio tunggal
    const ctx = getAudioContext();
    // Mendapatkan stempel waktu saat ini
    const now = ctx.currentTime;
    
    // 1. Kick/Impact Boom Menghentak (Punchy) di Awal
    const oscKick = ctx.createOscillator();
    const gainKick = ctx.createGain();
    // Gelombang segitiga agar hentakan bass empuk dan solid
    oscKick.type = 'triangle';
    // Mulai dari 150Hz
    oscKick.frequency.setValueAtTime(150, now);
    // Menyapu frekuensi dengan sangat cepat ke bawah dalam 500ms
    oscKick.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
    // Volume hentakan diatur sangat keras (0.7) untuk sensasi benturan dinamis
    gainKick.gain.setValueAtTime(0.7, now);
    gainKick.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    oscKick.connect(gainKick);
    gainKick.connect(ctx.destination);
    oscKick.start(now);
    oscKick.stop(now + 0.55);
    
    // 2. Synthesizer Brass Swell yang Semangat (Chord Major Bergelombang Gigi Gergaji)
    // Frekuensi chord A Major: A3 (220Hz), E4 (329.63Hz), A4 (440Hz), C#5 (554.37Hz)
    const freqs = [220, 329.63, 440, 554.37];
    freqs.forEach((f) => {
      // Membuat osilator nada
      const osc = ctx.createOscillator();
      // Gelombang gigi gergaji (sawtooth) agar menghasilkan karakter brass/terompet yang kencang dan bersemangat
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      // Menyapu frekuensi nada ke atas (1.2x) secara eksponensial dalam 2.8 detik
      osc.frequency.exponentialRampToValueAtTime(f * 1.2, now + 2.8);
      
      // Menggunakan BiquadFilter untuk filter sweep (membuat suara membuka megah)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      // Frekuensi filter mulai sangat rendah di 200Hz
      filter.frequency.setValueAtTime(200, now);
      // Menyapu naik ke 2500Hz dalam 1.2 detik (membuka warna suara agar terang cemerlang)
      filter.frequency.exponentialRampToValueAtTime(2500, now + 1.2);
      
      // Membuat gain node volume
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      // Volume membumbung kencang ke 0.35 dalam waktu 1.0 detik (efek swell brass yang bertenaga)
      gainNode.gain.linearRampToValueAtTime(0.35, now + 1.0);
      // Meluruhkan secara perlahan selama durasi transisi panggung 2.8 detik
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
      
      // Hubungkan osc -> filter -> gain -> speaker
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Jalankan suara chord
      osc.start(now);
      // Hentikan suara chord setelah 2.9 detik
      osc.stop(now + 2.9);
    });
  } catch (e) {
    // Menangani kegagalan inisialisasi pad whoosh
    console.error('Gagal memainkan audio panggung klasemen:', e);
  }
};

/**
 * Fungsi: playModeChangeSound
 * Deskripsi: Memicu bunyi bel transisi mode kuis yang sangat tenang, lembut, dan premium (kalem).
 *            Menggunakan gelombang sinus dengan volume tipis (0.12) dan arpeggio naik cepat.
 */
const playModeChangeSound = () => {
  try {
    // Mengambil atau menginisialisasi konteks audio tunggal aplikasi
    const ctx = getAudioContext();
    // Mendapatkan stempel waktu terkini dari konteks audio
    const now = ctx.currentTime;
    // Menyiapkan susunan nada harmonis (E5 = 659.25Hz dan A5 = 880Hz) untuk melodi naik
    const notes = [659.25, 880.00];
    
    // Menjadwalkan setiap nada secara sekuensial dengan jeda waktu arpeggio singkat 80ms
    notes.forEach((freq, idx) => {
      // Membuat generator osilasi gelombang suara baru
      const osc = ctx.createOscillator();
      // Mengatur tipe gelombang ke sine wave agar menghasilkan suara murni yang bulat dan lembut
      osc.type = 'sine';
      // Menyetel frekuensi target tepat pada waktu mulai nada yang bersangkutan
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      // Membuat node gain sebagai pengatur intensitas volume
      const g = ctx.createGain();
      // Memulai volume dari kesunyian mutlak (0) untuk mencegah distorsi letupan awal
      g.gain.setValueAtTime(0, now + idx * 0.08);
      // Menaikkan volume dengan kemiringan linier ke tingkat tipis 0.12 dalam 20 milidetik
      g.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      // Meluruhkan volume secara eksponensial ke nol dalam rentang 300 milidetik agar suara memudar alami
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
      
      // Menghubungkan jalur keluaran osilator ke pengatur volume
      osc.connect(g);
      // Menghubungkan pengatur volume ke tujuan audio utama (speaker perangkat)
      g.connect(ctx.destination);
      
      // Menjadwalkan osilator untuk mulai memancarkan getaran suara
      osc.start(now + idx * 0.08);
      // Menjadwalkan pemutusan suara agar osilator berhenti memproses getaran
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } catch (e) {
    // Mencatat detail kesalahan ke konsol jika sistem Web Audio gagal dijalankan
    console.error('Gagal memainkan suara ganti mode:', e);
  }
};

/**
 * Fungsi: playTickSound
 * Deskripsi: Memicu suara ketukan detik (tick/tock) dengan volume yang ditingkatkan agar terdengar kencang di seluruh ruangan.
 */
const playTickSound = (secondsLeft, maxVal) => {
  try {
    // Mendapatkan konteks audio tunggal
    const ctx = getAudioContext();
    // Mendapatkan waktu sekarang
    const now = ctx.currentTime;
    // Membuat oscillator generator gelombang suara
    const osc = ctx.createOscillator();
    // Membuat gain node pengatur volume
    const g = ctx.createGain();
    
    // Menghubungkan oscillator ke gain, dan gain ke speaker
    osc.connect(g);
    g.connect(ctx.destination);
    
    // Mendapatkan batas waktu kritis secara dinamis berdasarkan durasi maksimal
    const threshold = getDangerThreshold(maxVal || 30);
    
    // Memeriksa apakah sisa waktu berada di bawah atau sama dengan ambang kritis
    if (secondsLeft <= threshold) {
      // Beep peringatan kritis: gelombang sinus tinggi nyaring 850Hz, volume ditingkatkan sangat keras (0.90)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      g.gain.setValueAtTime(0.90, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // Detik biasa: gelombang segitiga woodblock hangat 400Hz, volume ditingkatkan keras (0.60)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      g.gain.setValueAtTime(0.60, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (error) {
    // Log kegagalan suara detikan
    console.error('Gagal memutar detikan:', error);
  }
};

/**
 * Fungsi: playAlarmSound
 * Deskripsi: Memicu suara bel alarm/buzzer selesai dengan volume yang ditingkatkan sangat keras (0.85).
 */
const playAlarmSound = () => {
  try {
    // Mendapatkan konteks audio tunggal
    const ctx = getAudioContext();
    // Mendapatkan stempel waktu saat ini
    const now = ctx.currentTime;
    // Membuat dua osilator untuk efek suara alarm mendengung kencang
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    // Membuat gain node pengatur volume
    const g = ctx.createGain();
    
    // Menyetel osilator pertama ke gelombang gergaji (sawtooth) frekuensi 180Hz
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    
    // Menyetel osilator kedua ke gelombang kotak (square) frekuensi 185Hz
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(185, now);
    
    // Menghubungkan kedua osilator ke gain node
    osc1.connect(g);
    osc2.connect(g);
    // Menghubungkan gain node ke speaker
    g.connect(ctx.destination);
    
    // Menyetel volume puncak alarm ke tingkat sangat keras (0.85)
    g.gain.setValueAtTime(0.85, now);
    // Mempertahankan volume kencang selama 800ms
    g.gain.linearRampToValueAtTime(0.85, now + 0.8);
    // Meluruhkan volume secara eksponensial ke sunyi hingga detik ke-1.2
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    // Menjalankan alarm secara serentak
    osc1.start(now);
    osc2.start(now);
    
    // Menghentikan alarm setelah 1.2 detik
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  } catch (error) {
    // Log kegagalan alarm habis
    console.error('Gagal memutar alarm selesai:', error);
  }
};

/**
 * Fungsi: playPodiumRiseSound
 * Deskripsi: Memicu efek suara kemunculan tiang peringkat secara sekuensial.
 *            Peringkat bawah-ke-2 mendapatkan efek bunyi reveal chord segitiga yang berenergi dan mantap (semangat).
 *            Peringkat 1 mendapatkan efek bunyi mahkota yang megah, sinematik, hangat (triangle sweep) dan tidak "alay".
 */
const playPodiumRiseSound = (rank) => {
  try {
    // Mengambil atau menginisialisasi konteks audio tunggal aplikasi
    const ctx = getAudioContext();
    // Mendapatkan stempel waktu terkini dari konteks audio
    const now = ctx.currentTime;
    
    // Mengevaluasi jika tiang yang naik adalah milik Juara Pertama (Pemenang Utama)
    if (rank === 1) {
      // Hentikan pemutaran audio juara 1 sebelumnya jika objek audio masih aktif berjalan
      if (activeWinnerAudio) {
        // Menghentikan (pause) pemutaran audio
        activeWinnerAudio.pause();
        // Menyetel ulang referensi audio ke null
        activeWinnerAudio = null;
      }
      
      // Membuat instans objek Audio baru yang memuat berkas MP3 dari server backend
      const audio = new Audio('http://localhost:5000/sound/tunetank-winner-awards.mp3');
      // Menyetel tingkat kekerasan volume MP3 Juara 1 secara kencang dan tebal di angka 0.85
      audio.volume = 0.85;
      // Menyimpan referensi objek audio baru ke variabel global agar dapat dihentikan saat keluar layar
      activeWinnerAudio = audio;
      
      // Menjalankan pemutaran musik kemenangan Juara 1 secara asinkron
      audio.play().catch(err => {
        // Mencatat kegagalan pemutaran MP3 Juara 1 jika ada pembatasan hak akses browser
        console.error('Gagal memainkan MP3 Juara 1:', err);
      });
    } else {
      // Menyiapkan chord arpeggio naik berenergi untuk peringkat lainnya (G3 = 196.0Hz, C4 = 261.63Hz, E4 = 329.63Hz)
      const freqs = [196.00, 261.63, 329.63];
      // Melakukan perulangan untuk menjadwalkan peluncuran nada dengan jeda arpeggio sangat cepat 50ms
      freqs.forEach((freq, idx) => {
        // Membuat generator osilasi gelombang suara baru
        const osc = ctx.createOscillator();
        // Membuat pengatur volume (gain) baru
        const g = ctx.createGain();
        // Menggunakan gelombang segitiga (triangle) agar suara terdengar penuh semangat namun tetap berbobot
        osc.type = 'triangle';
        // Menyetel frekuensi nada target sesuai jadwal arpeggio masing-masing
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        
        // Menginisialisasi volume dari nol pada waktu mulai nada
        g.gain.setValueAtTime(0, now + idx * 0.05);
        // Menaikkan volume dengan cepat ke tingkat mantap 0.45 dalam waktu 30ms setelah nada dipicu
        g.gain.linearRampToValueAtTime(0.45, now + idx * 0.05 + 0.03);
        // Meluruhkan volume secara eksponensial ke nol dalam durasi 500ms agar berdenting alami
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.5);
        
        // Menghubungkan keluaran osilator langsung ke pengatur volume
        osc.connect(g);
        // Menghubungkan pengatur volume ke speaker perangkat
        g.connect(ctx.destination);
        
        // Menyalakan osilator sesuai jadwal arpeggio
        osc.start(now + idx * 0.05);
        // Menghentikan osilator setelah nada meluruh sepenuhnya (600ms)
        osc.stop(now + idx * 0.05 + 0.6);
      });
    }
  } catch (e) {
    // Mencatat detail kegagalan sistem Web Audio ke konsol pengembang
    console.error('Gagal memutar audio podium naik:', e);
  }
};

// Referensi global untuk mencatat objek audio MP3 pemenang juara 1 yang sedang diputar
let activeWinnerAudio = null;

// Koneksi Socket.IO ke backend server
const socket = io('http://localhost:5000');

/**
 * Komponen: AnimatedScore
 * Deskripsi: Komponen anak penampil nilai skor tim dengan efek visual pertambahan/pengurangan poin,
 *            dilengkapi ref-based tracking untuk memastikan suara chime/buzz terpicu tepat 1 kali tanpa inkonsistensi.
 *            Ditambahkan tracking babak aktif agar suara perubahan poin tidak berbunyi ketika babak/mode berganti.
 */
const AnimatedScore = ({ rawScore, displayScore, teamColor, activeRoundId }) => {
  // Menggunakan useRef untuk mencatat nilai skor sebelumnya secara sinkron tanpa memicu siklus re-render ekstra
  const prevScoreRef = useRef(rawScore);
  // Menggunakan useRef untuk mencatat ID babak sebelumnya guna mendeteksi peralihan babak
  const prevRoundRef = useRef(activeRoundId);
  // State lokal untuk melacak kelas animasi aktif
  const [animClass, setAnimClass] = useState('');

  // Efek samping untuk memantau perubahan nilai rawScore dan activeRoundId
  useEffect(() => {
    // Membaca ID babak sebelumnya dari ref
    const prevRound = prevRoundRef.current;
    // Jika ID babak berubah, sinkronkan nilai skor tanpa memutar audio atau animasi
    if (prevRound !== activeRoundId) {
      // Memperbarui ref babak sebelumnya ke babak saat ini
      prevRoundRef.current = activeRoundId;
      // Memperbarui ref skor sebelumnya ke nilai skor awal babak baru
      prevScoreRef.current = rawScore;
      // Berhenti dan keluar dari efek samping agar tidak memicu deteksi selisih
      return;
    }

    // Membaca nilai skor sebelumnya dari ref
    const prev = prevScoreRef.current;
    
    // Kasus 1: Skor bertambah
    if (rawScore > prev) {
      // Memasang kelas animasi hijau pop up
      setAnimClass('score-increase');
      // Memutar efek suara lonceng chime naik
      playScoreAddSound();
      // Menghapus kelas animasi setelah durasi 600ms selesai
      const timer = setTimeout(() => setAnimClass(''), 600);
      // Memperbarui ref dengan nilai skor terbaru agar tersinkronisasi
      prevScoreRef.current = rawScore;
      // Membersihkan timer jika rawScore berubah lagi sebelum selesai
      return () => clearTimeout(timer);
    } 
    // Kasus 2: Skor berkurang
    else if (rawScore < prev) {
      // Memasang kelas animasi merah bergetar
      setAnimClass('score-decrease');
      // Memutar efek suara dengung buzz turun
      playScoreSubSound();
      // Menghapus kelas animasi setelah durasi 500ms selesai
      const timer = setTimeout(() => setAnimClass(''), 500);
      // Memperbarui ref dengan nilai skor terbaru agar tersinkronisasi
      prevScoreRef.current = rawScore;
      // Membersihkan timer
      return () => clearTimeout(timer);
    }
  }, [rawScore, activeRoundId]);

  // Fungsi pembantu lokal untuk konversi kode warna HEX ke RGBA demi bayangan glow
  const hexToRgbaLocal = (hex, alpha) => {
    // Mengurai komponen warna merah (R)
    const r = parseInt(hex.slice(1, 3), 16);
    // Mengurai komponen warna hijau (G)
    const g = parseInt(hex.slice(3, 5), 16);
    // Mengurai komponen warna biru (B)
    const b = parseInt(hex.slice(5, 7), 16);
    // Mengembalikan string format warna RGBA
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    // Kontainer penampil skor dengan animasi dinamis dan gaya berpijar sesuai warna tim
    <div className={`score-text ${animClass}`} style={{ 
      fontSize: 'clamp(8rem, 12vw, 14rem)', 
      fontWeight: 900, 
      color: '#ffffff',
      lineHeight: 1,
      marginTop: '4rem',
      marginBottom: 'auto',
      textAlign: 'center',
      textShadow: `0 0 5rem ${hexToRgbaLocal(teamColor, 0.7)}, 0 0 1.5rem ${hexToRgbaLocal(teamColor, 0.9)}`,
      fontFamily: "'Outfit', sans-serif",
      display: 'inline-block'
    }}>
      {displayScore}
    </div>
  );
};

export default function Display() {
  // === STATE ===
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [buzzerWinner, setBuzzerWinner] = useState(null);
  const [showBuzzerOverlay, setShowBuzzerOverlay] = useState(false);
  const [gameState, setGameState] = useState({
    activeRoundId: 1, timerValue: 0, timerMax: 30, timerStatus: 'stopped',
    timerType: 'countdown', activeBuzzerTeam: null, isBuzzerLocked: false,
    revealScores: true, tebakKataPlayer: 1, tebakKataMaxPlayers: 6,
    showTimerFullScreen: false
  });

  // State pelacak status layar penuh (fullscreen) — kursor disembunyikan saat fullscreen aktif
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Animasi FLIP Refs
  const refs = useRef({});
  const positions = useRef({});

  // Refs untuk mencatat nilai timer dan tampilan klasemen sebelumnya demi membatasi pemicu bunyi ganda
  const lastTimerValueRef = useRef(gameState.timerValue); // Ref penyimpan nilai detik timer sebelumnya
  const lastTimerStatusRef = useRef(gameState.timerStatus); // Ref penyimpan status timer sebelumnya
  const lastShowRankingRef = useRef(!!gameState.showRankingFullScreen); // Ref penyimpan status tampilan klasemen layar penuh sebelumnya

  // Refs pelacak mode aktif untuk mendeteksi pergantian mode/ronde
  const lastActiveRoundIdRef = useRef(gameState.activeRoundId); // Mencatat ID babak aktif terakhir
  const lastShowTimerFSRef = useRef(!!gameState.showTimerFullScreen); // Mencatat status timer layar penuh terakhir
  const lastShowRankingFSRef = useRef(!!gameState.showRankingFullScreen); // Mencatat status klasemen layar penuh terakhir

  // Efek samping untuk memantau perubahan waktu timer detik demi detik
  useEffect(() => {
    // Membaca nilai detik timer sebelumnya dari ref
    const prevVal = lastTimerValueRef.current;
    
    // Memperbarui ref dengan nilai detik saat ini untuk perbandingan berikutnya
    lastTimerValueRef.current = gameState.timerValue;
    
    // Bunyi detikan: dipicu jika status timer berjalan ('running') dan nilai detik berkurang
    if (gameState.timerStatus === 'running' && gameState.timerValue < prevVal) {
      // Jika waktu belum habis (di atas 0), putar suara detik (tick/tock)
      if (gameState.timerValue > 0) {
        // Panggil fungsi pemutar suara detik dengan parameter sisa waktu dan waktu maksimal
        playTickSound(gameState.timerValue, gameState.timerMax);
      }
    }
  }, [gameState.timerValue, gameState.timerStatus, gameState.timerMax]);

  // Efek samping untuk memantau peralihan mode tampilan atau babak aktif guna memicu suara transisi yang tenang
  useEffect(() => {
    // Mengambil data babak aktif sebelumnya dari ref pelacak
    const prevRoundId = lastActiveRoundIdRef.current;
    // Mengambil status layar penuh timer sebelumnya dari ref pelacak
    const prevShowTimerFS = lastShowTimerFSRef.current;
    // Mengambil status layar penuh klasemen sebelumnya dari ref pelacak
    const prevShowRankingFS = lastShowRankingFSRef.current;

    // Menentukan ID babak aktif saat ini dari state permainan
    const currentRoundId = gameState.activeRoundId;
    // Menentukan status layar penuh timer saat ini dari state permainan
    const currentShowTimerFS = !!gameState.showTimerFullScreen;
    // Menentukan status layar penuh klasemen saat ini dari state permainan
    const currentShowRankingFS = !!gameState.showRankingFullScreen;

    // Membandingkan apakah babak aktif telah bergeser/berubah
    const roundChanged = prevRoundId !== currentRoundId;
    // Membandingkan apakah mode layar penuh timer berubah status
    const timerFSChanged = prevShowTimerFS !== currentShowTimerFS;
    // Membandingkan apakah mode layar penuh klasemen berubah status
    const rankingFSChanged = prevShowRankingFS !== currentShowRankingFS;

    // Mengevaluasi jika salah satu dari ketiga komponen mode tampilan tersebut mengalami perubahan
    if (roundChanged || timerFSChanged || rankingFSChanged) {
      // Menghindari bentrokan suara jika mode baru yang dituju adalah klasemen (klasemen memutar sound whoosh)
      if (!currentShowRankingFS) {
        // Memicu audio transisi ganti mode yang tenang dan lembut (kalem)
        playModeChangeSound();
      }
      // Memperbarui ref pelacak babak aktif dengan nilai babak saat ini
      lastActiveRoundIdRef.current = currentRoundId;
      // Memperbarui ref pelacak status timer dengan nilai saat ini
      lastShowTimerFSRef.current = currentShowTimerFS;
      // Memperbarui ref pelacak status klasemen dengan nilai saat ini
      lastShowRankingFSRef.current = currentShowRankingFS;
    }
  }, [gameState.activeRoundId, gameState.showTimerFullScreen, gameState.showRankingFullScreen]);

  // Efek samping untuk mendeteksi kemunculan overlay papan peringkat / klasemen dan memicu backsound & suara tiang naik satu per satu
  useEffect(() => {
    // Membaca status penayangan klasemen sebelumnya dari ref
    const prevShow = lastShowRankingRef.current;
    // Menentukan apakah klasemen layar penuh sedang ditampilkan saat ini
    const currentShow = !!gameState.showRankingFullScreen;
    // Mengambil kunci animasi klasemen untuk pelacakan klik berulang
    const animationKey = gameState.rankingAnimationKey;
    
    // Memperbarui ref dengan status penayangan terbaru
    lastShowRankingRef.current = currentShow;
    
    // Jika layar klasemen sedang aktif
    if (currentShow) {
      // Catatan: Efek suara whoosh/swell pembuka ("ngueengggg") dinonaktifkan sesuai permintaan pengguna agar pembukaan klasemen lebih tenang.

      // Urutkan tim dari skor tertinggi ke terendah untuk keperluan kalkulasi visual podium
      const rankingTeams = [...teams].sort((a, b) => b.score - a.score);
      // Deteksi tipe klasemen (jika bukan 'sementara', berarti klasemen akhir/lomba selesai)
      const isKlasemenAkhir = gameState.rankingTitle?.toLowerCase() !== 'sementara';
      // Array penampung ID timer timeout untuk pembersihan memory leak
      const timeouts = [];

      // Loop setiap tim untuk menjadwalkan suara kemunculan podiumnya sesuai delay visual
      rankingTeams.forEach((team, index) => {
        // Menentukan peringkat tim (indeks berbasis 1)
        const rank = index + 1;
        // Variabel penampung delay dalam satuan detik
        let delay = 0;
        
        // Aturan delay untuk Klasemen Akhir (dramatis dari bawah ke atas)
        if (isKlasemenAkhir) {
          if (rank === 1) {
            delay = 8.5; // Juara 1 muncul paling terakhir (+3.0s setelah Juara 2)
          } else if (rank === 2) {
            delay = 5.5; // Juara 2 muncul perlahan setelah Juara 3 (+2.0s)
          } else if (rank === 3) {
            delay = 3.5; // Juara 3 muncul setelah barisan bawah (+1.5s)
          } else {
            delay = Math.max(0, (rankingTeams.length - rank) * 1.0); // Urutan cepat untuk peringkat bawah
          }
        } 
        // Aturan delay untuk Klasemen Sementara (muncul cepat bertahap dari bawah)
        else {
          delay = (rankingTeams.length - rank) * 1.0;
        }

        // Menentukan tambahan waktu jeda pemutaran suara agar sinkron dengan gerakan melonjak cepat (shoot up)
        let soundDelayOffset = 0;
        // Jika klasemen akhir dan peringkat 2 atau 3, tunda suara arpeggio hingga nama tim terlihat dan meluncur penuh (1.85 detik)
        if (isKlasemenAkhir && (rank === 2 || rank === 3)) {
          // Menetapkan delay offset suara sebanyak 1.85 detik agar sinkron dengan lonjakan cepat 75% durasi 2.5s
          soundDelayOffset = 1.85;
        }

        // Daftarkan callback pemutar suara naik untuk tiang ke-n setelah delay terlewati
        const timerId = setTimeout(() => {
          // Putar suara naik podium sesuai peringkatnya (agung untuk juara 1, impact untuk lainnya)
          playPodiumRiseSound(rank);
        }, (delay + soundDelayOffset) * 1000);
        
        // Simpan referensi timer ke array
        timeouts.push(timerId);
      });

      // Kembalikan fungsi cleanup untuk membatalkan semua timeout jika komponen di-unmount atau state berubah
      return () => {
        // Hapus setiap timeout yang terdaftar
        timeouts.forEach(clearTimeout);
        // Hentikan pemutaran audio Juara 1 jika sedang aktif
        if (activeWinnerAudio) {
          // Menghentikan (pause) pemutaran audio
          activeWinnerAudio.pause();
          // Menyetel ulang referensi audio ke null
          activeWinnerAudio = null;
        }
      };
    }
  }, [gameState.showRankingFullScreen, gameState.rankingAnimationKey, teams]);

  useLayoutEffect(() => {
    teams.forEach((t) => {
      const el = refs.current[t.id];
      if (el) positions.current[t.id] = el.getBoundingClientRect();
    });
  });

  useLayoutEffect(() => {
    teams.forEach((t) => {
      const el = refs.current[t.id];
      const first = positions.current[t.id];
      if (el && first) {
        const last = el.getBoundingClientRect();
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        if (deltaX !== 0 || deltaY !== 0) {
          el.style.transition = 'none';
          el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease';
            el.style.transform = '';
          });
        }
      }
    });
  }, [gameState.revealScores, teams]);

  // === SOCKET & DATA FETCH ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Melakukan request paralel untuk mengambil tim, babak, dan state game awal dari server
        const [tmRes, rdRes, gsRes] = await Promise.all([
          // Mengambil daftar tim
          fetch('http://localhost:5000/api/teams'),
          // Mengambil konfigurasi babak
          fetch('http://localhost:5000/api/rounds'),
          // Mengambil state permainan saat ini
          fetch('http://localhost:5000/api/game-state')
        ]);
        // Memperbarui state daftar tim
        setTeams(await tmRes.json());
        // Memperbarui state daftar babak
        setRounds(await rdRes.json());
        // Membaca data state game dari response JSON
        const initialGameState = await gsRes.json();
        // Menetapkan state game awal agar sinkron pasca-reload halaman
        setGameState(initialGameState);
      } catch (e) {
        // Mencatat kegagalan pengambilan data awal ke konsol
        console.error('Fetch error:', e);
      }
    };
    fetchData();

    socket.on('game-state', (s) => {
      setGameState(s);
      if (s.activeBuzzerTeam) {
        setBuzzerWinner(s.activeBuzzerTeam);
        setShowBuzzerOverlay(true);
      } else {
        setShowBuzzerOverlay(false);
      }
    });

    socket.on('timer-tick', (v) => setGameState(p => ({ ...p, timerValue: v })));
    socket.on('timer-finished', () => {
      // Memutar alarm buzzer panjang saat menerima sinyal waktu habis dari server
      playAlarmSound();
    });
    socket.on('teams-updated', (t) => setTeams(t));
    socket.on('buzzer-ready', () => { setBuzzerWinner(null); setShowBuzzerOverlay(false); });
    socket.on('buzzer-triggered', (name) => {
      setBuzzerWinner(name);
      setShowBuzzerOverlay(true);
      try {
        // Menggunakan AudioContext global tunggal agar konsisten dan terhindar dari limitasi browser
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        g.gain.setValueAtTime(0.35, ctx.currentTime); // Dinaikkan volumenya agar lebih jelas terdengar
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (e) {}
    });

    return () => ['game-state','timer-tick','teams-updated','buzzer-ready','buzzer-triggered','timer-finished'].forEach(e => socket.off(e));
  }, []);

  useEffect(() => {
    if (rounds.length > 0) {
      setActiveRound(rounds.find(r => r.id === gameState.activeRoundId) || rounds[0]);
    }
  }, [gameState.activeRoundId, rounds]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'f' || e.key === 'F') toggleFullscreen(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Efek samping untuk mendeteksi perubahan status fullscreen dari browser
  useEffect(() => {
    // Handler yang dipanggil setiap kali status fullscreen berubah (masuk/keluar)
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement); // true jika ada elemen fullscreen, false jika tidak
    };
    // Mendaftarkan event listener pada document untuk semua prefix browser
    document.addEventListener('fullscreenchange', onFullscreenChange);
    // Membersihkan listener saat komponen di-unmount
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Fungsi pembantu untuk mengambil skor tim di babak aktif
  const getActiveRoundScore = (team) => {
    if (team.roundScores && gameState.activeRoundId) {
      return team.roundScores[gameState.activeRoundId] || 0;
    }
    return team.score || 0; // Fallback ke total skor jika data per babak belum siap
  };

  // Posisi tim dibuat paten (tidak berubah-ubah) berdasarkan urutan pembuatan (ID)
  const sortedTeams = [...teams].sort((a, b) => a.id - b.id);

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const showTimerFS = !!gameState.showTimerFullScreen;
  const showRankingFS = !!gameState.showRankingFullScreen;
  const isMainHidden = showTimerFS || showRankingFS;

  // Format timer dinamis: Selalu tampilkan dalam format detik murni (misal: 60, 90, dst)
  const formatTimer = (seconds) => {
    return seconds.toString();
  };

  return (
    <div onDoubleClick={toggleFullscreen} style={{
      backgroundColor: '#0a0b10', // Dark navy cyber background
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 0.1rem, transparent 0.1rem), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 0.1rem, transparent 0.1rem)`,
      backgroundSize: '4rem 4rem',
      minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
      padding: 'clamp(2rem, 4vh, 4rem) clamp(3rem, 5vw, 6rem)',
      color: '#ffffff', fontFamily: "'Outfit', sans-serif", overflow: 'hidden',
      position: 'relative', userSelect: 'none',
      cursor: isFullscreen ? 'none' : 'default', // Kursor disembunyikan saat fullscreen, ditampilkan saat windowed
      border: '0.2rem solid #2b3b6a', // Border luar mirip screenshot
      boxSizing: 'border-box'
    }}>

      <style>{`
        @keyframes scorePopUp {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.5) drop-shadow(0 0 4rem #4ade80); color: #4ade80; }
          100% { transform: scale(1); filter: brightness(1); color: #ffffff; }
        }
        @keyframes scoreShakeDown {
          0% { transform: translateX(0); filter: brightness(1); }
          20% { transform: translateX(-1rem); filter: brightness(1.2) drop-shadow(0 0 3rem #f43f5e); color: #f43f5e; }
          40% { transform: translateX(1rem); color: #f43f5e; }
          60% { transform: translateX(-0.5rem); color: #f43f5e; }
          80% { transform: translateX(0.5rem); color: #f43f5e; }
          100% { transform: translateX(0); filter: brightness(1); color: #ffffff; }
        }
        @keyframes heartbeatDanger {
          0% { transform: scale(1); color: #f43f5e; text-shadow: 0 0 5rem rgba(244,63,94,0.5); }
          30% { transform: scale(1.15); color: #ff0000; text-shadow: 0 0 15rem rgba(255,0,0,1); }
          100% { transform: scale(1); color: #f43f5e; text-shadow: 0 0 5rem rgba(244,63,94,0.5); }
        }
        .score-increase {
          animation: scorePopUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .score-decrease {
          animation: scoreShakeDown 0.5s ease-in-out;
        }
        .timer-danger {
          animation: heartbeatDanger 1s infinite;
        }
        @keyframes dramaticReveal {
          0% { transform: scale(0.5) translateY(20rem); opacity: 0; filter: blur(2rem); }
          60% { transform: scale(1.1) translateY(-2rem); opacity: 1; filter: brightness(2) blur(0); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: brightness(1); }
        }
        @keyframes crownGlow {
          0% { filter: drop-shadow(0 0 1rem #fbbf24); transform: translateY(0); }
          50% { filter: drop-shadow(0 0 4rem #fbbf24) brightness(1.5); transform: translateY(-1rem); }
          100% { filter: drop-shadow(0 0 1rem #fbbf24); transform: translateY(0); }
        }
      `}</style>

      {/* Konten Utama Layar Display (Akan disembunyikan jika Timer / Ranking Layar Penuh Aktif) */}
      <div style={{
        flexGrow: 1, display: 'flex', flexDirection: 'column',
        opacity: isMainHidden ? 0 : 1, pointerEvents: isMainHidden ? 'none' : 'auto',
        transform: isMainHidden ? 'scale(0.92)' : 'scale(1)', transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
      }}>

        {/* HEADER: PIL SHAPED BANNER */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          {/* Kontainer banner dengan class CSS eksternal responsif */}
          <div className="display-banner">
            {/* Judul Acara Lomba */}
            <span style={{ fontSize: 'clamp(2rem, 2.5vw, 3rem)', fontWeight: 900, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 0.2rem 0.5rem rgba(0,0,0,0.5)' }}>
              LOMBA CERDAS CERMAT
            </span>
            {/* Garis pemisah responsif */}
            <div className="display-banner-divider" />
            {/* Nama babak aktif */}
            <span style={{ fontSize: 'clamp(1.8rem, 2vw, 2.5rem)', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.15em', textShadow: '0 0.2rem 0.5rem rgba(0,0,0,0.5)' }}>
              {activeRound ? activeRound.name : 'Persiapan'}
            </span>
          </div>
        </div>

        {/* SCORE GRID (FLAT) - Menggunakan class responsif eksternal */}
        <div className="display-score-grid">
          {sortedTeams.map((team, idx) => {
            const isBuzzerActive = buzzerWinner === team.name; // Status apakah bel ditekan oleh tim ini
            const teamColor = team.color || '#6366f1'; // Warna tim bawaan (default) jika tidak ditentukan
            const roundScore = getActiveRoundScore(team); // Nilai skor tim di babak aktif saat ini
            const displayScore = gameState.revealScores ? roundScore.toLocaleString() : '---'; // Menentukan apakah skor diungkap atau ditutup

            return (
              <div 
                key={team.id} // Kunci unik komponen anak React untuk pelacakan render
                ref={el => refs.current[team.id] = el} // Referensi DOM kartu skor untuk pemicuan animasi
                className="display-score-card" // Menggunakan class CSS eksternal responsif
                style={{
                  // Gaya dinamis berbasis status buzzer aktif/tidak aktif
                  boxShadow: isBuzzerActive 
                    ? `0 0 8rem ${hexToRgba(teamColor, 0.8)}, inset 0 0 4rem ${hexToRgba(teamColor, 0.5)}` 
                    : `0 2.5rem 5rem rgba(0,0,0,0.6), inset 0 0.2rem 0.2rem rgba(255,255,255,0.15), inset 0 -1rem 3rem rgba(0,0,0,0.5), 0 0 4rem ${hexToRgba(teamColor, 0.15)}`,
                  transform: isBuzzerActive ? 'scale(1.05)' : 'translateY(-0.5rem)', // Skala membesar jika bel dipicu
                  border: `0.2rem solid ${isBuzzerActive ? teamColor : hexToRgba(teamColor, 0.25)}` // Border tebal berwarna tim jika buzzer menyala
                }}
              >

                {/* Header Kartu: Nama Tim */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', textAlign: 'center', marginBottom: 'auto' }}>
                  <div>
                    {/* Teks nama tim berskala fluid */}
                    <div style={{ 
                      fontSize: 'clamp(3rem, 4vw, 4.5rem)', 
                      fontWeight: 900, 
                      color: '#ffffff', 
                      letterSpacing: '0.05em', 
                      textTransform: 'uppercase',
                      transform: 'skewX(-4deg)',
                      textShadow: '-0.08rem 0.08rem 0 #0ea5e9, 0.08rem -0.08rem 0 #f97316, 0 0.4rem 0.8rem rgba(0,0,0,0.8)'
                    }}>
                      {team.name}
                    </div>
                  </div>
                </div>

                {/* Nilai Skor Raksasa Dinamis */}
                <AnimatedScore rawScore={roundScore} displayScore={displayScore} teamColor={teamColor} activeRoundId={gameState.activeRoundId} />

              </div>
            );
          })}
        </div>
      </div>


      {/* === LAYAR TIMER FULLSCREEN / CEPAT TEPAT === */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0a0b10',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingBottom: '8vh', // Menggeser keseluruhan blok sedikit ke atas
        opacity: showTimerFS ? 1 : 0, pointerEvents: showTimerFS ? 'auto' : 'none',
        transition: 'opacity 0.7s ease', zIndex: showTimerFS ? 100 : -1
      }}>
        {(() => {
          const activeTKTeam = teams.find(t => t.id === gameState.tebakKataActiveTeamId);
          // Hitung ambang batas bahaya secara dinamis berdasarkan nilai durasi maksimum timer
          const dangerThreshold = getDangerThreshold(gameState.timerMax || 30);
          // Cek apakah nilai timer berada di zona kritis (bahaya)
          const isDanger = gameState.timerValue > 0 && gameState.timerValue <= dangerThreshold;
          // Setel warna teks merah jika kritis, putih jika normal
          const timerColor = isDanger ? '#f43f5e' : '#ffffff';
          // Setel warna bayangan glow lebih terang jika kritis
          const shadowColor = activeTKTeam ? hexToRgba(activeTKTeam.color, isDanger ? 0.9 : 0.6) : 'rgba(99,102,241,0.6)';

          return (
            <>
              <div style={{ 
                fontSize: 'clamp(4rem, 5vw, 6rem)', 
                color: activeTKTeam ? activeTKTeam.color : '#ffffff', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em', 
                fontWeight: 900, 
                marginBottom: '5rem',
                textShadow: `0 0.5rem 2rem ${activeTKTeam ? hexToRgba(activeTKTeam.color, 0.5) : 'transparent'}`
              }}>
                {activeTKTeam ? activeTKTeam.name : 'TIMER TEBAK KATA'}
              </div>
              <div 
                className={isDanger ? 'timer-danger' : ''}
                style={{ 
                  fontSize: 'clamp(35rem, 55vw, 65rem)', 
                  fontWeight: 900, 
                  lineHeight: 1, 
                  color: timerColor, 
                  textShadow: `0 0 15rem ${shadowColor}`, 
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.3s ease'
                }}
              >
                {formatTimer(gameState.timerValue)}
              </div>

              {/* Mini Scoreboard Cards di Bawah Timer - Menggunakan class responsif eksternal */}
              <div className="display-mini-cards">
                {sortedTeams.map((team) => {
                  const roundScore = getActiveRoundScore(team); // Nilai skor tim di babak aktif saat ini
                  const isActive = activeTKTeam && activeTKTeam.id === team.id; // Menandai jika tim aktif menjawab
                  
                  return (
                    <div 
                      key={team.id} // Kunci unik komponen anak React
                      className="display-mini-card" // Menggunakan class CSS eksternal responsif
                      style={{
                        // Gaya visual dinamis berdasarkan status keaktifan tim saat ini
                        background: isActive 
                          ? `linear-gradient(145deg, ${hexToRgba(team.color, 0.3)} 0%, ${hexToRgba(team.color, 0.1)} 100%)`
                          : `linear-gradient(145deg, rgba(34, 43, 69, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)`,
                        border: `0.2rem solid ${isActive ? team.color : hexToRgba(team.color, 0.3)}`, // Border menyala jika aktif
                        borderTop: `0.6rem solid ${team.color}`, // Aksen warna tim di tepi atas kartu
                        boxShadow: isActive 
                          ? `0 0 3rem ${hexToRgba(team.color, 0.4)}, inset 0 0 2rem ${hexToRgba(team.color, 0.2)}`
                          : `0 1rem 2rem rgba(0,0,0,0.5)`, // Pendaran glow jika tim aktif menjawab
                        transform: isActive ? 'translateY(-1rem) scale(1.05)' : 'translateY(0) scale(1)', // Sedikit mengangkat kartu tim yang aktif
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' // Efek transisi halus
                      }}
                    >
                      <span style={{ 
                        fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', 
                        textTransform: 'uppercase', letterSpacing: '0.05em', 
                        textAlign: 'center', marginBottom: '1rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'
                      }}>
                        {team.name}
                      </span>
                      <span style={{ 
                        fontSize: '4.5rem', fontWeight: 900, color: isActive ? '#ffffff' : team.color, 
                        textShadow: isActive ? `0 0 2rem ${hexToRgba(team.color, 0.8)}, 0 0 4rem ${team.color}` : 'none', 
                        lineHeight: 1, fontFamily: 'var(--font-outfit)'
                      }}>
                        {gameState.revealScores ? roundScore.toLocaleString() : '---'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* === LAYAR PENGUMUMAN JUARA (KLASEMEN AKHIR) DENGAN ANIMASI DRAMATIS === */}
      {/* === LAYAR PENGUMUMAN JUARA (KLASEMEN AKHIR) DENGAN ANIMASI DRAMATIS === */}
      {showRankingFS && (
        <>
        {/* Deklarasi CSS Keyframe secara lokal khusus untuk animasi panggung klasemen akhir */}
        <style>{`
          /* Animasi masuk naik elastis dari bawah dengan efek blur dan pencahayaan */
          @keyframes dramaticRise {
            0% { transform: translateY(120vh) scale(0.85); opacity: 0; filter: blur(1.5rem) brightness(0); }
            65% { transform: translateY(-2.5rem) scale(1.03); opacity: 1; filter: blur(0) brightness(1.5); }
            85% { transform: translateY(1rem) scale(0.98); filter: brightness(1.1); }
            100% { transform: translateY(0) scale(1); opacity: 1; filter: brightness(1); }
          }
          /* Animasi naik dramatis untuk peringkat 3, 2, 1: dari bawah pelan, lalu meluncur cepat setelah nama tim terlihat */
          @keyframes dramaticRiseTop {
            0% { 
              /* Memulai dari posisi di bawah layar sepenuhnya */
              transform: translateY(105%) scale(0.95); 
              /* Awal transparan */
              opacity: 0; 
              /* Sedikit efek blur */
              filter: blur(0.8rem); 
              /* Easing halus untuk perayapan awal */
              animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1); 
            }
            75% { 
              /* Naik lambat hingga nama tim dan tulisan juara terlihat jelas */
              transform: translateY(45%) scale(0.97); 
              /* Menjadi solid penuh */
              opacity: 1; 
              /* Menghapus blur */
              filter: blur(0); 
              /* Easing meletup cepat (snap overshoot) */
              animation-timing-function: cubic-bezier(0.3, 1.5, 0.5, 1); 
            }
            88% { 
              /* Melonjak overshoot ke atas melebihi tinggi normal */
              transform: translateY(-3%) scale(1.02); 
              /* Efek kilauan kecerahan puncak */
              filter: brightness(1.15); 
              /* Easing pelan saat kembali mendarat */
              animation-timing-function: ease-out; 
            }
            100% { 
              /* Mendarat sempurna di posisi nol */
              transform: translateY(0) scale(1); 
              /* Tetap solid */
              opacity: 1; 
              /* Normal kecerahan */
              filter: brightness(1); 
            }
          }
          /* Animasi denyut cahaya emas mewah (luxury gold) di sekeliling podium juara pertama */
          @keyframes championGlow {
            0%, 100% { box-shadow: 0 0 3rem rgba(251, 191, 36, 0.2), inset 0 0 1.5rem rgba(251, 191, 36, 0.05); border-color: #fbbf24; }
            50% { box-shadow: 0 0 5rem rgba(251, 191, 36, 0.45), inset 0 0 2.5rem rgba(251, 191, 36, 0.15); border-color: #ffe066; }
          }
          /* Animasi masuk mahkota secara dramatis dengan pembesaran elastis */
          @keyframes fadeInCrown {
            0% { opacity: 0; transform: translateY(-8rem) scale(0.3) rotate(-15deg); filter: drop-shadow(0 0 0 transparent); }
            70% { transform: translateY(1.5rem) scale(1.2) rotate(5deg); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotate(-5deg); filter: drop-shadow(0 0 2rem rgba(251, 191, 36, 0.8)); }
          }
          /* Animasi melayang melingkar lembut untuk mahkota setelah mendarat */
          @keyframes crownFloat {
            0%, 100% { transform: translateY(0) rotate(-5deg) scale(1); filter: drop-shadow(0 0 2rem rgba(251, 191, 36, 0.8)); }
            50% { transform: translateY(-1.5rem) rotate(5deg) scale(1.1); filter: drop-shadow(0 0 4.5rem rgba(251, 191, 36, 1)); }
          }
          /* Efek kilatan cahaya diagonal (shimmer) menyapu permukaan kartu podium secara berkala */
          @keyframes shimmerSweep {
            0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
            15% { opacity: 0.65; }
            35% { opacity: 0; }
            100% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
          }
          /* Denyut cahaya latar belakang panggung (ambient) */
          @keyframes spotlightPulse {
            0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.95; transform: translateX(-50%) scale(1.08); }
          }
          /* Memudarkan sorotan cahaya berwarna tim di belakang podium */
          @keyframes fadeInSpotlight {
            0% { opacity: 0; transform: translateX(-50%) scale(0.6) translateY(5rem); }
            100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
          }
          /* Animasi teks sinematik melebar dan memudar masuk untuk judul */
          @keyframes trackingExpand {
            0% { letter-spacing: -0.5em; opacity: 0; filter: blur(2rem); }
            60% { opacity: 0.8; filter: blur(0.5rem); }
            100% { letter-spacing: 0.15em; opacity: 1; filter: blur(0); }
          }
        `}</style>
        {/* Container overlay klasemen penuh dengan latar belakang radial gelap */}
        <div 
          key={gameState.rankingAnimationKey || 'ranking'}
          style={{ 
            position: 'absolute', // Menentukan posisi absolut di seluruh area layar display
            top: 0, // Mengunci tepi atas ke 0
            left: 0, // Mengunci tepi kiri ke 0
            right: 0, // Mengunci tepi kanan ke 0
            bottom: 0, // Mengunci tepi bawah ke 0
            zIndex: 9999, // Memastikan kontainer berada di atas seluruh elemen halaman display utama
            background: 'radial-gradient(circle at top, #16153b 0%, #0a0b10 60%, #020204 100%)', // Latar belakang radial gradasi gelap bertema panggung
            display: 'flex', // Mengaktifkan tata letak flexbox untuk memposisikan anak elemen secara fleksibel
            flexDirection: 'column', // Mengatur arah flexbox secara vertikal (kolom)
            justifyContent: 'flex-end', // Memposisikan konten di bagian bawah agar podium menempel di dasar layar
            alignItems: 'center', // Menyelaraskan seluruh elemen anak di tengah secara horizontal
            overflow: 'hidden' // Menyembunyikan elemen meluap untuk kelancaran animasi masuk dari luar layar
          }}>
          
          {/* Sorotan Cahaya Ambient (Spotlight) Panggung Utama di Latar Belakang */}
          <div style={{
            position: 'absolute', // Posisi absolut di latar belakang
            bottom: 0, // Menempel pada batas bawah layar
            left: '50%', // Posisikan di tengah horizontal
            transform: 'translateX(-50%)', // Pusatkan jangkar titik tengah
            width: '140vw', // Mengatur lebar sorotan melebihi layar proyektor
            height: '75vh', // Mengatur tinggi sorotan setengah lebih tinggi dari viewport
            background: 'radial-gradient(ellipse at bottom, rgba(99,102,241,0.12) 0%, rgba(15,23,42,0) 70%)', // Gradasi elips warna indigo lembut yang memudar ke transparan
            filter: 'blur(6rem)', // Memberikan efek blur ekstra lembut untuk menghasilkan ilusi kedalaman panggung
            pointerEvents: 'none', // Mengabaikan klik agar tidak memblokir antarmuka di depannya
            zIndex: 1, // Berada di tumpukan bawah sebelum kartu podium
            animation: 'spotlightPulse 6s infinite ease-in-out' // Menerapkan animasi denyut lambat yang dinamis
          }} />

          {(() => {
            // Urutkan tim berdasarkan Skor Total untuk Klasemen Akhir
            const rankingTeams = [...teams].sort((a, b) => b.score - a.score);
            
            // Susun array agar Juara 1 di tengah, 2 di kiri, 3 di kanan, dst.
            const podiumOrder = [];
            rankingTeams.forEach((team, index) => {
              if (index % 2 === 1) {
                podiumOrder.unshift({ team, rank: index + 1 });
              } else {
                podiumOrder.push({ team, rank: index + 1 });
              }
            });

            return (
              <>
                {/* Judul Klasemen Akhir / Sementara */}
                <h1 style={{ 
                  position: 'absolute', // Pemosisian absolut terpisah di bagian atas layar
                  top: '5rem', // Jarak aman 5rem dari batas atas layar
                  fontSize: 'clamp(5rem, 6vw, 7.5rem)', // Tipografi dinamis agar terbaca jelas di proyektor besar maupun monitor laptop
                  color: '#ffffff', // Warna teks putih kontras tinggi
                  textTransform: 'uppercase', // Selalu huruf kapital untuk nama judul resmi
                  letterSpacing: '0.15em', // Memberikan ruang renggang antar huruf yang bernuansa futuristik
                  textShadow: '0 1rem 3rem rgba(0,0,0,0.8), 0 0 2rem rgba(251,191,36,0.3)', // Bayangan ganda untuk keterbacaan di atas latar gelap
                  opacity: 0, // Mulai dari tidak terlihat untuk di-animasikan masuk
                  fontFamily: "'Outfit', sans-serif", // Menggunakan jenis huruf Outfit yang modern dan tegas
                  fontWeight: 900, // Ketebalan ekstra tebal untuk judul utama
                  animation: 'trackingExpand 1.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards', // Efek pembukaan sinematik
                  zIndex: 3 // Di atas elemen sorotan latar belakang
                }}>
                  KLASEMEN <span style={{ color: '#fbbf24', textShadow: '0 0 3rem rgba(251,191,36,0.6)' }}>{gameState.rankingTitle || 'AKHIR'}</span>
                </h1>
                
                {/* Kontainer Barisan Podium - Menggunakan class responsif eksternal */}
                <div className="display-podium-container">
                  {podiumOrder.map(({ team, rank }, index) => {
                    const isWinner = rank === 1; // Menandai jika tim menempati peringkat pertama
                    const isKlasemenAkhir = gameState.rankingTitle?.toLowerCase() !== 'sementara'; // Menentukan tipe klasemen
                    
                    // Mengatur jeda (delay) kemunculan podium secara dramatis
                    let delay = 0; // Menginisialisasi variabel delay bernilai 0
                    if (isKlasemenAkhir) {
                      // Penundaan berjenjang khusus klasemen akhir
                      if (rank === 1) {
                        delay = 8.5; // Juara 1 muncul paling akhir (+3.0s setelah Juara 2)
                      } else if (rank === 2) {
                        delay = 5.5; // Juara 2 muncul perlahan setelah Juara 3 (+2.0s)
                      } else if (rank === 3) {
                        delay = 3.5; // Juara 3 muncul setelah barisan bawah (+1.5s)
                      } else {
                        delay = Math.max(0, (rankingTeams.length - rank) * 1.0); // Urutan cepat untuk peringkat bawah
                      }
                    } else {
                      delay = (rankingTeams.length - rank) * 1.0; // Urutan cepat konstan untuk klasemen sementara
                    } 
                    
                    // Skala tinggi dinamis barisan podium
                    const heightPercentages = [100, 72, 58, 46, 36, 28]; // Persentase tinggi tiap peringkat
                    const heightPercent = heightPercentages[rank - 1] || 25; // Mengambil data tinggi atau default ke 25%

                    return (
                      // Kontainer Utama Kartu Tim Peringkat dengan class CSS eksternal responsif
                      <div 
                        // Kunci unik komponen anak React untuk memfasilitasi rerender yang efisien
                        key={team.id} 
                        // Menggunakan class CSS eksternal responsif untuk tata letak kolom podium
                        className="display-podium-item" 
                        style={{
                          // Juara 1 (pemenang utama) dibuat 1.5x lebih lebar daripada juara lainnya agar tampak menonjol
                          flex: isWinner ? 1.5 : 1, 
                          // Tinggi tiang podium diatur berdasarkan persentase (Juara 1 paling tinggi, dst)
                          height: `${heightPercent}%`, 
                          // Menerapkan tampang animasi dramaticRiseTop (naik lambat lalu meluncur cepat) untuk juara 1, 2, 3 di klasemen akhir, lainnya standar
                          animation: (isKlasemenAkhir && rank <= 3)
                            ? 'dramaticRiseTop 2.5s linear forwards'
                            : 'dramaticRise 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                          // Awalnya disembunyikan agar efek fade-in dari animasi tidak bocor sebelum delay selesai
                          opacity: 0,
                          // Delay animasi dinamis (Juara 3 -> Juara 2 -> Juara 1 paling akhir agar dramatis)
                          animationDelay: `${delay}s`, 
                          // Menempatkan Juara 1 di tumpukan z-index teratas agar tidak terpotong tiang di sampingnya
                          zIndex: isWinner ? 10 : 5 
                        }}
                      >
                        
                        {/* Sorotan cahaya belakang berwarna tim untuk efek panggung */}
                        <div style={{
                          position: 'absolute', // Menempel secara absolut di belakang podium masing-masing tim
                          bottom: 0, // Mengunci di bagian bawah
                          left: '50%', // Menjajarkan di tengah horizontal
                          transform: 'translateX(-50%)', // Memusatkan titik tengah koordinat
                          width: '180%', // Lebar sorotan dibuat melebihi lebar kartu agar berpendar ke samping
                          height: '140%', // Tinggi pendaran sorotan warna tim
                          background: `radial-gradient(ellipse at bottom, ${hexToRgba(team.color, 0.3)} 0%, transparent 70%)`, // Gradasi pancaran sesuai warna identitas tim
                          filter: 'blur(3.5rem)', // Efek blur lembut agar pendaran menyatu dengan panggung utama
                          opacity: 0, // Mulai dari transparan
                          animation: 'fadeInSpotlight 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards', // Memudarkan sorotan masuk sesaat setelah podium naik
                          animationDelay: `${delay + 0.8}s`, // Jeda waktu menyelaraskan dengan naiknya podium
                          pointerEvents: 'none', // Menghindari interaksi kursor mouse
                          zIndex: -1 // Diletakkan di belakang kartu bar podium
                        }} />
                        
                        {/* Render khusus Mahkota Emas bagi Juara 1 */}
                        {isWinner && (
                          <div style={{ 
                            marginBottom: '2rem', // Memberi jarak 2rem dari mahkota ke bar podium bawah
                            animation: `fadeInCrown 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, crownFloat 3.5s ease-in-out infinite 1.2s`, // Animasi masuk kemudian berlanjut melayang
                            animationDelay: `${delay + 1.2}s, ${delay + 2.4}s`, // Delay sinkron setelah podium juara 1 mendarat
                            color: '#fbbf24', // Warna dasar kuning emas hangat
                            opacity: 0, // Awal tidak terlihat
                            zIndex: 12 // Diletakkan di tumpukan teratas mahkota
                          }}>
                            {/* Gambar Vektor Mahkota Emas Premium dengan Detail Permata */}
                            <svg width="8rem" height="8rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0.8rem 2.5rem rgba(251,191,36,0.6))' }}>
                              {/* Gradasi warna emas premium (logam mengkilap) */}
                              <defs>
                                <linearGradient id="premiumGold" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#ffe066" />
                                  <stop offset="40%" stopColor="#f59e0b" />
                                  <stop offset="70%" stopColor="#d97706" />
                                  <stop offset="100%" stopColor="#92400e" />
                                </linearGradient>
                                <linearGradient id="gemBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#60a5fa" />
                                  <stop offset="100%" stopColor="#1d4ed8" />
                                </linearGradient>
                                <linearGradient id="gemRed" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#f87171" />
                                  <stop offset="100%" stopColor="#b91c1c" />
                                </linearGradient>
                              </defs>
                              
                              {/* Pola utama mahkota */}
                              <path 
                                d="M2 16 L4 8 C4.5 6.5 5.5 6.5 6 8 L8 12 L11.5 5 C11.8 4.3 12.2 4.3 12.5 5 L16 12 L18 8 C18.5 6.5 19.5 6.5 20 8 L22 16 C22 17 21 18 19 18.2 C15 18.6 9 18.6 5 18.2 C3 18 2 17 2 16 Z" 
                                fill="url(#premiumGold)" 
                                stroke="#78350f" 
                                strokeWidth="0.5" 
                                strokeLinejoin="round" 
                              />
                              
                              {/* Ikat bawah mahkota (crown band) */}
                              <path 
                                d="M4 16.5 C8 17.2 16 17.2 20 16.5 L19.5 18 C15.5 18.5 8.5 18.5 4.5 18 Z" 
                                fill="#78350f" 
                              />
                              
                              {/* Mutiara/Bulatan emas di puncak setiap duri mahkota */}
                              <circle cx="4" cy="7.5" r="1" fill="#ffe066" stroke="#d97706" strokeWidth="0.3" />
                              <circle cx="12" cy="4.5" r="1.3" fill="#ffe066" stroke="#d97706" strokeWidth="0.3" />
                              <circle cx="20" cy="7.5" r="1" fill="#ffe066" stroke="#d97706" strokeWidth="0.3" />
                              
                              {/* Permata/Ruby Hiasan di bagian ikat mahkota */}
                              <rect x="11" y="16.7" width="2" height="1" rx="0.5" fill="url(#gemRed)" />
                              <circle cx="7" cy="17" r="0.6" fill="url(#gemBlue)" />
                              <circle cx="17" cy="17" r="0.6" fill="url(#gemBlue)" />
                            </svg>
                          </div>
                        )}

                        {/* Kartu Bar Fisik Podium */}
                        <div style={{
                          background: isWinner 
                            ? 'linear-gradient(135deg, rgba(24, 24, 37, 0.95) 0%, rgba(46, 38, 20, 0.98) 100%)' // Gradasi logam arang gelap dengan bias emas mewah
                            : `linear-gradient(to top, ${hexToRgba(team.color, 0.85)} 0%, ${hexToRgba(team.color, 0.15)} 100%)`, // Gradasi standar sesuai warna masing-masing tim
                          borderTop: isWinner ? '0.4rem solid #fbbf24' : `0.3rem solid ${team.color}`, // Garis tepi atas tebal sebagai aksen warna tim
                          borderLeft: isWinner ? '0.15rem solid rgba(251, 191, 36, 0.4)' : `0.1rem solid ${hexToRgba(team.color, 0.35)}`, // Batas samping kiri transparan
                          borderRight: isWinner ? '0.15rem solid rgba(251, 191, 36, 0.4)' : `0.1rem solid ${hexToRgba(team.color, 0.35)}`, // Batas samping kanan transparan
                          width: '100%', // Lebar penuh menyesuaikan kolom flex
                          height: '100%', // Mengisi sisa tinggi kolom sepenuhnya
                          display: 'flex', // Mengatur isi kartu secara vertikal
                          flexDirection: 'column', // Arah susunan elemen ke bawah
                          alignItems: 'center', // Memposisikan teks di tengah horizontal kartu
                          justifyContent: 'flex-start', // Menyusun elemen dari atas ke bawah
                          padding: isWinner ? '3rem 1.5rem' : '2.5rem 1.5rem', // Padding responsif lebih besar untuk juara 1
                          borderRadius: '1.8rem 1.8rem 0 0', // Sudut melengkung premium di bagian atas saja
                          boxShadow: isWinner 
                            ? '0 1rem 4rem rgba(0, 0, 0, 0.6), inset 0 0 3rem rgba(251, 191, 36, 0.05)'
                            : `0 -1rem 4rem ${hexToRgba(team.color, 0.25)}, inset 0 2rem 4rem ${hexToRgba(team.color, 0.08)}`, // Efek bayangan redup untuk selain juara 1
                          animation: isWinner ? 'championGlow 3s infinite ease-in-out' : 'none', // Menerapkan pendaran emas mewah jika juara 1
                          animationDelay: isWinner ? `${delay + 1.2}s` : 'none', // Jeda pendaran setelah podium selesai mendarat
                          position: 'relative', // Konteks posisi relatif bagi overlay kilasan cahaya
                          overflow: 'hidden' // Mencegah kilasan cahaya keluar dari batas lekukan sudut kartu
                        }}>
                          
                          {/* Efek kilasan cahaya diagonal (shimmer sweep) yang menyapu permukaan kartu secara berkala */}
                          <div style={{
                            position: 'absolute', // Menempel secara absolut menutupi kartu
                            top: 0, // Batas atas
                            left: 0, // Batas kiri
                            width: '200%', // Lebar dibuat 2 kali lipat agar sapuan dari kiri ke kanan terlihat sempurna
                            height: '100%', // Tinggi penuh
                            background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)', // Garis kilau putih memudar di tengah gradasi
                            animation: 'shimmerSweep 4s infinite ease-in-out', // Kecepatan sapuan gloss 4 detik secara berulang
                            animationDelay: `${delay + 1.5}s`, // Mulai menyapu setelah podium berdiri kokoh
                            pointerEvents: 'none', // Mengabaikan deteksi kursor
                            zIndex: 2 // Di atas tulisan angka peringkat latar belakang agar sapuan menyinari teks
                          }} />

                          {/* Angka Peringkat Transparan di Latar Belakang Kartu */}
                          <div style={{
                            position: 'absolute', // Diposisikan melayang secara absolut
                            top: '10%', // Jarak 10% dari atas kartu
                            left: '50%', // Tengah horizontal
                            transform: 'translateX(-50%)', // Memposisikan anchor pas di tengah
                            fontSize: '20rem', // Ukuran font raksasa
                            fontWeight: 900, // Ketebalan ekstra tebal
                            color: 'rgba(255,255,255,0.035)', // Warna putih ultra transparan agar samar di latar belakang
                            lineHeight: 0.8, // Mengurangi spasi baris agar rapat
                            pointerEvents: 'none', // Abaikan sentuhan kursor mouse
                            zIndex: 0 // Berada paling belakang di dalam kartu
                          }}>
                            {rank}
                          </div>

                          {/* Label Peringkat atau Juara berdasarkan tipe klasemen */}
                          <span style={{ 
                            fontSize: isWinner ? '2.4rem' : '1.8rem', // Mengatur ukuran font yang lebih besar khusus untuk pemenang utama podium
                            fontWeight: 600, // Menggunakan ketebalan font semi-bold agar teks terlihat tegas
                            color: '#94a3b8', // Menggunakan warna abu-abu kebiruan (slate) agar harmonis dengan tema gelap
                            textTransform: 'uppercase', // Mengubah tulisan menjadi huruf besar secara otomatis
                            letterSpacing: '0.1em', // Menambahkan spasi antar-karakter untuk tampilan visual yang lebih elegan
                            zIndex: 1 // Memastikan teks berada di atas bayangan angka peringkat latar belakang
                          }}>
                            {/* Menampilkan label "Peringkat" jika judul klasemen adalah "Sementara", atau label "Juara" untuk klasemen akhir */}
                            {gameState.rankingTitle?.toLowerCase() === 'sementara' ? `Peringkat ${rank}` : `Juara ${rank}`}
                          </span>

                          {/* Teks Nama Tim */}
                          <span style={{ 
                            fontSize: isWinner ? '3.6rem' : '2.4rem', // Ukuran font nama tim lebih besar untuk pemenang
                            fontWeight: 800, // Ketebalan ekstra tebal
                            color: '#ffffff', // Warna teks putih
                            marginTop: '1rem', // Jarak atas 1rem dari label peringkat
                            textTransform: 'uppercase', // Otomatis mengubah ke huruf kapital
                            letterSpacing: '0.05em', // Jarak renggang antar huruf tipis
                            textAlign: 'center', // Teks diletakkan rata tengah
                            textShadow: '0 0.5rem 1rem rgba(0,0,0,0.5)', // Efek bayangan teks agar menonjol dari latar belakang podium
                            zIndex: 1 // Berada di depan lapisan angka transparan
                          }}>
                            {team.name}
                          </span>
                          
                          {/* Kontainer Skor Poin Akhir di bagian bawah kartu */}
                          <div style={{
                            marginTop: 'auto', // Mendorong kontainer poin ini otomatis ke posisi terbawah kartu
                            marginBottom: '2rem', // Jarak aman 2rem dari batas bawah kartu
                            display: 'flex', // Tata letak flex untuk penyusunan teks poin secara kolom
                            flexDirection: 'column', // Arah susunan elemen ke bawah
                            alignItems: 'center', // Rata tengah secara horizontal
                            zIndex: 1 // Di atas lapisan angka transparan
                          }}>
                            {/* Label Kecil "Poin Akhir" */}
                            <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Poin Akhir</span>
                            {/* Nilai Skor Tim */}
                            <span style={{ 
                              fontSize: isWinner ? '5rem' : '3.6rem', // Ukuran poin raksasa terutama bagi pemenang
                              fontWeight: 900, // Tebal maksimal
                              color: isWinner ? '#fbbf24' : '#ffffff', // Warna kuning emas bagi pemenang utama, putih bagi lainnya
                              textShadow: `0 0 2rem ${isWinner ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.4)'}`, // Efek cahaya neon di sekeliling poin
                              fontFamily: "'Outfit', sans-serif", // Font Outfit premium
                              lineHeight: 1, // Menempel ketat tanpa margin tinggi sisa
                              marginTop: '0.5rem' // Jarak atas 0.5rem dari label poin akhir
                            }}>
                              {team.score.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
        </>
      )}

      {/* Menampilkan logo Kediri Technopark secara absolut di bagian kanan atas layar tanpa teks "Powered by" */}
      <BrandingLogo />

    </div>
  );
}
