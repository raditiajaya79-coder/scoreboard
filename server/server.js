import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeDatabase,
  queryAll,
  queryGet,
  runCommand
} from './db.js';

// Inisialisasi Express app
const app = express();

// Inisialisasi HTTP Server untuk dibagikan dengan Socket.IO
const httpServer = createServer(app);

// Inisialisasi Socket.IO Server dengan izin CORS dari asal apa pun (cocok untuk local dev)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware untuk mem-parsing body request berbasis JSON
app.use(express.json());

// Middleware untuk mengaktifkan CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Mendapatkan nama direktori saat ini dalam lingkup ES Module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Menyediakan akses folder sound secara statis agar MP3 Juara 1 dapat dimuat via HTTP
app.use('/sound', express.static(path.join(__dirname, '../sound')));

// Inisialisasi database SQLite dan membuat tabel/data awal jika belum ada
initializeDatabase();

// ==========================================
// STATE ENGINE DALAM MEMORY (REAL-TIME STATE)
// ==========================================
// State ini disimpan di RAM server untuk sinkronisasi instan melalui Socket.IO
let gameState = {
  activeRoundId: 1,      // ID babak yang sedang aktif dimainkan
  timerValue: 0,         // Nilai detik timer berjalan saat ini
  timerMax: 30,          // Batas awal hitung mundur timer
  timerStatus: 'stopped',// Status timer: 'running', 'paused', 'stopped'
  timerType: 'countdown',// Jenis timer: 'countdown', 'stopwatch', 'none'
  activeBuzzerTeam: null,// Nama tim yang berhasil menekan buzzer pertama kali
  isBuzzerLocked: false, // Status apakah buzzer tim lain terkunci
  revealScores: true,    // Apakah skor di display disembunyikan (Reveal Engine)
  tebakKataPlayer: 1,    // Index pemain aktif dalam Tebak Kata (1 s/d N)
  tebakKataMaxPlayers: 6,// Jumlah maksimal peserta estafet Tebak Kata
  showTimerFullScreen: false, // Status apakah layar display menampilkan timer secara penuh (fullscreen)
  showRankingFullScreen: false, // Status layar klasemen juara akhir
  tebakKataActiveTeamId: null, // ID tim yang sedang main di mode tebak kata
  tebakKataDuration: 10 // Durasi detik per pemain
};

// Variabel untuk menyimpan referensi interval timer server
let timerInterval = null;

// Helper untuk mengambil tim beserta skor per babaknya
async function getTeamsWithRoundScores() {
  // Ambil data tim dengan urutan tetap berdasarkan ID (tidak berubah posisinya)
  const teams = await queryAll('SELECT * FROM teams ORDER BY id ASC');
  const logs = await queryAll('SELECT team_id, round_id, change_value FROM score_logs');
  
  // Inisialisasi properti roundScores
  teams.forEach(t => {
    t.roundScores = {}; 
  });

  // Agregasi skor berdasarkan round_id
  logs.forEach(log => {
    const t = teams.find(team => team.id === log.team_id);
    if (t) {
      if (!t.roundScores[log.round_id]) t.roundScores[log.round_id] = 0;
      t.roundScores[log.round_id] += log.change_value;
    }
  });

  return teams;
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

/**
 * Endpoint: POST /api/login
 * Tujuan: Melakukan otentikasi sederhana untuk admin dan operator.
 */
app.post('/api/login', async (req, res) => {
  // Mengambil username dan password dari body request
  const { username, password } = req.body;
  try {
    // Mencari user di database yang cocok dengan kredensial
    const user = await queryGet('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    // Jika user ditemukan, kembalikan data user tersebut
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      // Jika tidak ditemukan, kembalikan status error unauthorized
      res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
  } catch (error) {
    // Menangani error server dan mengembalikan status 500
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: GET /api/event
 * Tujuan: Mengambil detail data event aktif pertama.
 */
app.get('/api/event', async (req, res) => {
  try {
    // Mengambil satu data event teratas
    const event = await queryGet('SELECT * FROM events LIMIT 1');
    // Mengembalikan data event dalam bentuk JSON
    res.json(event);
  } catch (error) {
    // Mengembalikan kode status 500 jika gagal mengakses database
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: PUT /api/event
 * Tujuan: Memperbarui informasi nama event, deskripsi, dan tanggal.
 */
app.put('/api/event', async (req, res) => {
  // Mengambil parameter pembaruan dari body request
  const { name, date, description } = req.body;
  try {
    // Mengeksekusi query pembaruan di database
    await runCommand('UPDATE events SET name = ?, date = ?, description = ? WHERE id = 1', [name, date, description]);
    // Mengambil data terupdate untuk disinkronkan ke client
    const updated = await queryGet('SELECT * FROM events WHERE id = 1');
    // Memancarkan event Socket.IO agar semua display/operator terupdate
    io.emit('event-updated', updated);
    // Mengirim respon sukses
    res.json({ success: true, event: updated });
  } catch (error) {
    // Penanganan kesalahan database
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: GET /api/teams
 * Tujuan: Mengambil daftar seluruh tim, diurutkan berdasarkan skor tertinggi (Ranking Engine).
 */
app.get('/api/teams', async (req, res) => {
  try {
    // Mengambil seluruh tim diurutkan berdasarkan skor menurun, beserta skor per babaknya
    const teams = await getTeamsWithRoundScores();
    // Mengembalikan array tim
    res.json(teams);
  } catch (error) {
    // Mengembalikan status error server
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: POST /api/teams
 * Tujuan: Mendaftarkan tim baru ke dalam kompetisi.
 */
app.post('/api/teams', async (req, res) => {
  // Mengambil nama dan warna tim dari request
  const { name, color } = req.body;
  try {
    // Memasukkan data tim baru dengan skor awal 0
    const result = await runCommand('INSERT INTO teams (name, color, score) VALUES (?, ?, 0)', [name, color]);
    // Mengambil baris data tim baru yang baru dimasukkan
    const newTeam = await queryGet('SELECT * FROM teams WHERE id = ?', [result.lastID]);
    // Mengambil semua tim yang ada untuk update ranking beserta roundScores
    const allTeams = await getTeamsWithRoundScores();
    // Mengirim broadcast update tim ke seluruh client
    io.emit('teams-updated', allTeams);
    // Mengembalikan data tim baru
    res.json(newTeam);
  } catch (error) {
    // Menangani error jika nama tim duplikat
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: PUT /api/teams/:id
 * Tujuan: Mengubah informasi tim (nama, warna, skor) secara manual.
 */
app.put('/api/teams/:id', async (req, res) => {
  // Mengambil ID tim dari parameter URL
  const { id } = req.params;
  // Mengambil data pembaruan dari body
  const { name, color, score } = req.body;
  try {
    // Melakukan update di tabel teams
    await runCommand('UPDATE teams SET name = ?, color = ?, score = ? WHERE id = ?', [name, color, score, id]);
    // Mendapatkan seluruh tim pasca update skor beserta roundScores
    const allTeams = await getTeamsWithRoundScores();
    // Mengirim broadcast perubahan data tim
    io.emit('teams-updated', allTeams);
    // Memberikan respon sukses
    res.json({ success: true });
  } catch (error) {
    // Mengembalikan kode status 500
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: DELETE /api/teams/:id
 * Tujuan: Menghapus tim dari sistem.
 */
app.delete('/api/teams/:id', async (req, res) => {
  // Mengambil parameter ID tim yang akan dihapus
  const { id } = req.params;
  try {
    // Menghapus data tim di database
    await runCommand('DELETE FROM teams WHERE id = ?', [id]);
    // Mendapatkan semua tim sisa beserta roundScores
    const allTeams = await getTeamsWithRoundScores();
    // Memancarkan daftar tim terbaru
    io.emit('teams-updated', allTeams);
    // Mengembalikan respon sukses
    res.json({ success: true });
  } catch (error) {
    // Mengembalikan error database
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: GET /api/rounds
 * Tujuan: Mengambil seluruh konfigurasi babak lomba yang ada.
 */
app.get('/api/rounds', async (req, res) => {
  try {
    // Mengambil semua babak dari database
    const rounds = await queryAll('SELECT * FROM rounds');
    // Mengirim data babak ke client
    res.json(rounds);
  } catch (error) {
    // Mengembalikan status error server
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: POST /api/rounds
 * Tujuan: Membuat babak baru dengan konfigurasi poin dan timer yang ditentukan.
 */
app.post('/api/rounds', async (req, res) => {
  // Mengambil konfigurasi babak baru
  const { name, description, duration, timer_type, points_correct, points_wrong } = req.body;
  try {
    // Menyimpan babak baru ke database
    const result = await runCommand(
      'INSERT INTO rounds (name, description, duration, timer_type, points_correct, points_wrong) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, duration, timer_type, points_correct, points_wrong]
    );
    // Mengambil data babak yang baru dibuat
    const newRound = await queryGet('SELECT * FROM rounds WHERE id = ?', [result.lastID]);
    // Mengirim broadcast update babak ke semua client
    io.emit('rounds-updated', await queryAll('SELECT * FROM rounds'));
    // Mengembalikan data babak baru
    res.json(newRound);
  } catch (error) {
    // Menangani error database
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: PUT /api/rounds/:id
 * Tujuan: Mengupdate detail konfigurasi babak.
 */
app.put('/api/rounds/:id', async (req, res) => {
  // Mengambil ID babak
  const { id } = req.params;
  // Mengambil konfigurasi baru
  const { name, description, duration, timer_type, points_correct, points_wrong } = req.body;
  try {
    // Menjalankan query update data babak
    await runCommand(
      'UPDATE rounds SET name = ?, description = ?, duration = ?, timer_type = ?, points_correct = ?, points_wrong = ? WHERE id = ?',
      [name, description, duration, timer_type, points_correct, points_wrong, id]
    );
    // Mengirim broadcast update babak
    io.emit('rounds-updated', await queryAll('SELECT * FROM rounds'));
    // Mengembalikan respon sukses
    res.json({ success: true });
  } catch (error) {
    // Mengembalikan respon error
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: DELETE /api/rounds/:id
 * Tujuan: Menghapus babak dari sistem.
 */
app.delete('/api/rounds/:id', async (req, res) => {
  // Mengambil ID babak dari parameter url
  const { id } = req.params;
  try {
    // Menghapus baris babak bersangkutan
    await runCommand('DELETE FROM rounds WHERE id = ?', [id]);
    // Mengirim broadcast update babak terbaru
    io.emit('rounds-updated', await queryAll('SELECT * FROM rounds'));
    // Mengembalikan respon sukses
    res.json({ success: true });
  } catch (error) {
    // Mengembalikan status error server
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: GET /api/game-state
 * Tujuan: Mengambil state game saat ini untuk sinkronisasi awal saat klien memuat ulang halaman.
 */
app.get('/api/game-state', (req, res) => {
  // Mengirimkan objek gameState saat ini ke client
  res.json(gameState);
});

/**
 * Endpoint: DELETE /api/logs
 * Tujuan: Menghapus seluruh histori log mutasi skor (Reset Engine).
 */
app.delete('/api/logs', async (req, res) => {
  try {
    // Menghapus semua baris data di tabel score_logs dari database
    await runCommand('DELETE FROM score_logs');
    
    // Mengambil data tim terbaru (skor babak terhitung kosong karena logs sudah bersih)
    const allTeams = await getTeamsWithRoundScores();
    
    // Mengirim broadcast data tim terbaru ke semua client yang terhubung secara realtime
    io.emit('teams-updated', allTeams);
    
    // Memancarkan daftar log kosong ke semua client agar tabel log ter-reset seketika
    io.emit('logs-updated', []);
    
    // Memberikan respons JSON sukses kepada pemanggil API
    res.json({ success: true });
  } catch (error) {
    // Menangani error database dan mengembalikan status code 500
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: GET /api/logs
 * Tujuan: Mengambil histori log penambahan/pengurangan poin (History Engine).
 */
app.get('/api/logs', async (req, res) => {
  try {
    // Mengambil log dengan detail nama tim dan nama babak melalui INNER JOIN
    const logs = await queryAll(`
      SELECT l.*, t.name as team_name, r.name as round_name 
      FROM score_logs l
      JOIN teams t ON l.team_id = t.id
      JOIN rounds r ON l.round_id = r.id
      ORDER BY l.timestamp DESC LIMIT 100
    `);
    // Mengembalikan array log histori skor
    res.json(logs);
  } catch (error) {
    // Mengembalikan error database
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: POST /api/scores/change
 * Tujuan: Mengubah skor tim dan merekam aksinya dalam log histori.
 */
app.post('/api/scores/change', async (req, res) => {
  // Mengambil data perubahan skor
  const { team_id, round_id, change_value, description } = req.body;
  try {
    // 1. Ambil skor tim saat ini
    const team = await queryGet('SELECT score FROM teams WHERE id = ?', [team_id]);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }
    // Kalkulasi skor baru
    const newScore = team.score + change_value;
    // 2. Perbarui skor tim
    await runCommand('UPDATE teams SET score = ? WHERE id = ?', [newScore, team_id]);
    // 3. Masukkan ke tabel score_logs untuk audit dan undo
    const timestamp = new Date().toLocaleTimeString('id-ID'); // Format waktu lokal Indonesia
    await runCommand(
      'INSERT INTO score_logs (timestamp, team_id, round_id, change_value, description) VALUES (?, ?, ?, ?, ?)',
      [timestamp, team_id, round_id, change_value, description]
    );
    // 4. Ambil semua tim terbaru beserta roundScores untuk disinkronkan ke client
    const allTeams = await getTeamsWithRoundScores();
    const allLogs = await queryAll(`
      SELECT l.*, t.name as team_name, r.name as round_name 
      FROM score_logs l
      JOIN teams t ON l.team_id = t.id
      JOIN rounds r ON l.round_id = r.id
      ORDER BY l.timestamp DESC LIMIT 100
    `);
    // Broadcast data tim dan log terupdate
    io.emit('teams-updated', allTeams);
    io.emit('logs-updated', allLogs);
    // Mengembalikan respon sukses
    res.json({ success: true, score: newScore });
  } catch (error) {
    // Menangani error server
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: POST /api/scores/undo
 * Tujuan: Membatalkan aksi penambahan/pengurangan nilai terakhir (Undo Engine).
 */
app.post('/api/scores/undo', async (req, res) => {
  try {
    // 1. Ambil baris log skor paling terakhir dimasukkan
    const lastLog = await queryGet('SELECT * FROM score_logs ORDER BY id DESC LIMIT 1');
    // Jika tidak ada log terdaftar, batalkan proses
    if (!lastLog) {
      return res.status(400).json({ success: false, message: 'Tidak ada log untuk di-undo.' });
    }
    // 2. Ambil skor tim terdaftar saat ini
    const team = await queryGet('SELECT score FROM teams WHERE id = ?', [lastLog.team_id]);
    if (team) {
      // Hitung balik skor (kebalikan dari perubahan nilai awal)
      const revertedScore = team.score - lastLog.change_value;
      // Update skor tim yang dibatalkan
      await runCommand('UPDATE teams SET score = ? WHERE id = ?', [revertedScore, lastLog.team_id]);
    }
    // 3. Hapus baris log terakhir yang baru saja dibatalkan
    await runCommand('DELETE FROM score_logs WHERE id = ?', [lastLog.id]);
    // 4. Ambil daftar tim beserta roundScores dan log terupdate
    const allTeams = await getTeamsWithRoundScores();
    const allLogs = await queryAll(`
      SELECT l.*, t.name as team_name, r.name as round_name 
      FROM score_logs l
      JOIN teams t ON l.team_id = t.id
      JOIN rounds r ON l.round_id = r.id
      ORDER BY l.timestamp DESC LIMIT 100
    `);
    // Broadcast hasil undo ke seluruh client aktif
    io.emit('teams-updated', allTeams);
    io.emit('logs-updated', allLogs);
    // Respon sukses dengan id log yang dihapus
    res.json({ success: true, undoneLogId: lastLog.id });
  } catch (error) {
    // Menangani error server database
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// SOCKET.IO REAL-TIME GAME ENGINE SYNC
// ==========================================
io.on('connection', (socket) => {
  console.log(`Client terhubung: ${socket.id}`);

  // Kirim state game awal kepada client yang baru terhubung
  socket.emit('game-state', gameState);

  // Menerima request pembaruan state game dari operator
  socket.on('update-game-state', (newState) => {
    // Gabungkan state game saat ini dengan perubahan baru
    gameState = { ...gameState, ...newState };
    // Broadcast state game terbaru ke semua client terhubung
    io.emit('game-state', gameState);
  });

  // Penanganan Timer Engine: START TIMER
  socket.on('timer-start', () => {
    // Hanya jalankan jika timer tidak sedang berjalan
    if (gameState.timerStatus !== 'running') {
      gameState.timerStatus = 'running';
      // Mengirim status terupdate ke semua client
      io.emit('game-state', gameState);

      // Memulai interval hitung mundur per detik (1000ms)
      timerInterval = setInterval(() => {
        // Logika hitung mundur untuk timer bertipe countdown
        if (gameState.timerType === 'countdown') {
          // Jika nilai timer masih di atas 0, kurangi 1 detik
          if (gameState.timerValue > 0) {
            // Mengurangi nilai detik timer sebanyak 1
            gameState.timerValue -= 1;
            // Memancarkan perubahan nilai detik ke semua client terhubung secara realtime
            io.emit('timer-tick', gameState.timerValue);
            
            // Jika setelah dikurangi nilainya tepat mencapai 0, hentikan timer & bunyikan bel seketika
            if (gameState.timerValue === 0) {
              // Hentikan interval eksekusi hitung mundur
              clearInterval(timerInterval);
              // Setel status permainan menjadi stopped
              gameState.timerStatus = 'stopped';
              // Kirim state game terbaru (dengan status stopped) ke seluruh client
              io.emit('game-state', gameState);
              // Pancarkan sinyal bahwa timer telah habis untuk memicu efek suara alarm di display
              io.emit('timer-finished');
            }
          }
        } 
        // Logika stopwatch bertambah nilainya per detik
        else if (gameState.timerType === 'stopwatch') {
          gameState.timerValue += 1;
          io.emit('timer-tick', gameState.timerValue);
        }
      }, 1000);
    }
  });

  // Penanganan Timer Engine: PAUSE TIMER
  socket.on('timer-pause', () => {
    // Hentikan interval pembaruan timer
    clearInterval(timerInterval);
    gameState.timerStatus = 'paused';
    // Broadcast state game terbaru
    io.emit('game-state', gameState);
  });

  // Penanganan Timer Engine: RESET TIMER
  socket.on('timer-reset', (resetValue) => {
    // Hentikan interval pembaruan timer
    clearInterval(timerInterval);
    gameState.timerStatus = 'stopped';
    // Tetapkan nilai timer ke nilai awal yang ditentukan
    gameState.timerValue = typeof resetValue === 'number' ? resetValue : gameState.timerMax;
    // Broadcast state game terbaru
    io.emit('game-state', gameState);
  });

  // Penanganan Buzzer Engine: ACTIVATE / START BUZZER
  socket.on('buzzer-start', () => {
    gameState.activeBuzzerTeam = null; // Hapus data tim tercepat sebelumnya
    gameState.isBuzzerLocked = false;   // Buka kunci buzzer agar bisa ditekan kembali
    io.emit('game-state', gameState);   // Sinkronisasikan state game ke client
    io.emit('buzzer-ready');            // Emit sinyal bahwa buzzer siap ditekan
  });

  // Penanganan Buzzer Engine: PRESS BUZZER (Tim Menekan Tombol)
  socket.on('buzzer-press', (teamName) => {
    // Hanya izinkan pendaftaran jika buzzer tidak dalam kondisi terkunci
    if (!gameState.isBuzzerLocked) {
      gameState.activeBuzzerTeam = teamName; // Daftarkan tim tercepat
      gameState.isBuzzerLocked = true;       // Kunci buzzer tim lain agar tidak dapat menyela
      io.emit('game-state', gameState);      // Sinkronisasikan state terbaru
      io.emit('buzzer-triggered', teamName);  // Emit event trigger buzzer kepada client
    }
  });

  // Penanganan disconnect client
  socket.on('disconnect', () => {
    console.log(`Client terputus: ${socket.id}`);
  });
});

// Menentukan Port server (default 5000)
const PORT = process.env.PORT || 5000;

// Menjalankan HTTP server dan Socket.IO server
httpServer.listen(PORT, () => {
  console.log(`Server ECCS berjalan di port http://localhost:${PORT}`);
});
