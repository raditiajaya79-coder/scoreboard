import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Mendapatkan path directory saat ini menggunakan ES Modules
const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

// Membuka database SQLite secara otomatis atau membuat baru jika belum ada
// Menggunakan kelas sqlite3.Database dengan verbose untuk detail debugging yang lebih baik
const db = new (sqlite3.verbose().Database)(dbPath, (err) => {
  if (err) {
    console.error('Koneksi database gagal:', err.message);
  } else {
    console.log('Terhubung ke database SQLite lokal.');
  }
});

/**
 * Fungsi: initializeDatabase
 * Tujuan: Membuat tabel-tabel utama yang diperlukan untuk ECCS jika tabel belum ada di database,
 * serta mengisi data contoh (seeding) untuk kemudahan demonstrasi awal.
 *
 * Pendekatan Alternatif: Migrasi SQL menggunakan library eksternal (seperti Knex/Sequelize)
 * lebih aman untuk aplikasi besar. Namun, pendekatan mentah dengan db.serialize() ini
 * lebih efisien untuk aplikasi mandiri tanpa dependensi tambahan yang berat.
 */
export function initializeDatabase() {
  // db.serialize memastikan bahwa setiap query dijalankan secara berurutan
  db.serialize(() => {
    // 1. Tabel Users untuk menyimpan data login operator/admin
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `, (err) => {
      if (err) console.error('Gagal membuat tabel users:', err.message);
    });

    // 2. Tabel Events untuk detail kompetisi yang berlangsung
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT,
        description TEXT,
        logo TEXT
      )
    `);

    // 3. Tabel Teams untuk nama, warna, dan status tim
    db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        logo TEXT,
        score INTEGER DEFAULT 0
      )
    `);

    // 4. Tabel Rounds untuk daftar babak beserta konfigurasinya
    db.run(`
      CREATE TABLE IF NOT EXISTS rounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        duration INTEGER DEFAULT 30,
        timer_type TEXT DEFAULT 'countdown',
        points_correct INTEGER DEFAULT 100,
        points_wrong INTEGER DEFAULT 0,
        rules TEXT
      )
    `);

    // 5. Tabel Score Logs untuk merekam histori skor dan mendukung sistem Undo
    db.run(`
      CREATE TABLE IF NOT EXISTS score_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        team_id INTEGER NOT NULL,
        round_id INTEGER NOT NULL,
        change_value INTEGER NOT NULL,
        description TEXT NOT NULL,
        FOREIGN KEY (team_id) REFERENCES teams (id),
        FOREIGN KEY (round_id) REFERENCES rounds (id)
      )
    `);

    // Inisialisasi Data Awal (Seeding) jika tabel masih kosong
    // Menambahkan user default: admin/admin, operator/operator
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (!err && row.count === 0) {
        db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'admin', 'admin')"); // Input akun admin
        db.run("INSERT INTO users (username, password, role) VALUES ('operator', 'operator', 'operator')"); // Input akun operator
      }
    });

    // Menambahkan tim default: Garuda, Rajawali, Merah Putih, Nusantara
    db.get('SELECT COUNT(*) as count FROM teams', [], (err, row) => {
      if (!err && row.count === 0) {
        db.run("INSERT INTO teams (name, color, score) VALUES ('Garuda', '#EF4444', 0)"); // Tim 1: Merah
        db.run("INSERT INTO teams (name, color, score) VALUES ('Rajawali', '#3B82F6', 0)"); // Tim 2: Biru
        db.run("INSERT INTO teams (name, color, score) VALUES ('Merah Putih', '#10B981', 0)"); // Tim 3: Hijau
        db.run("INSERT INTO teams (name, color, score) VALUES ('Nusantara', '#F59E0B', 0)"); // Tim 4: Oranye
      }
    });

    // Menambahkan babak default
    db.get('SELECT COUNT(*) as count FROM rounds', [], (err, row) => {
      if (!err && row.count === 0) {
        db.run("INSERT INTO rounds (name, description, duration, timer_type, points_correct, points_wrong) VALUES ('Babak 1: Pertanyaan Cerdas Cermat', 'Pertanyaan cerdas cermat dengan poin normal.', 0, 'none', 100, -50)");
        db.run("INSERT INTO rounds (name, description, duration, timer_type, points_correct, points_wrong) VALUES ('Babak 2: Tebak Kata', 'Estafet kata dengan timer bergiliran.', 30, 'countdown', 100, 0)");
      }
    });

    // Menambahkan event default
    db.get('SELECT COUNT(*) as count FROM events', [], (err, row) => {
      if (!err && row.count === 0) {
        db.run("INSERT INTO events (name, date, description) VALUES ('HUT RI Ke-81', '2026-08-17', 'Kompetisi Akbar Antar Tim Republik Indonesia')");
      }
    });
  });
}

/**
 * Fungsi: queryAll
 * Parameter: sql (string query), params (array of parameters)
 * Return: Promise yang mengembalikan baris data hasil query (array)
 * Tujuan: Mengembalikan baris data dari SQLite dalam bentuk Promise agar mendukung async/await secara rapi.
 */
export function queryAll(sql, params = []) {
  // Membuat promise pembungkus fungsi asinkron database SQLite
  return new Promise((resolve, reject) => {
    // Fungsi database all() mengeksekusi query dan mengembalikan seluruh baris data
    db.all(sql, params, (err, rows) => {
      // Jika terjadi error, kirim error ke handler reject
      if (err) reject(err);
      // Jika berhasil, kirim baris data ke handler resolve
      else resolve(rows);
    });
  });
}

/**
 * Fungsi: queryGet
 * Parameter: sql (string query), params (array of parameters)
 * Return: Promise yang mengembalikan satu baris data hasil query
 * Tujuan: Mengambil satu baris data (misal berdasarkan ID) dalam bentuk Promise.
 */
export function queryGet(sql, params = []) {
  // Membuat promise pembungkus fungsi asinkron database SQLite
  return new Promise((resolve, reject) => {
    // Fungsi database get() mengeksekusi query dan mengembalikan baris pertama saja
    db.get(sql, params, (err, row) => {
      // Jika terjadi error, kirim error ke handler reject
      if (err) reject(err);
      // Jika berhasil, kirim baris data ke handler resolve
      else resolve(row);
    });
  });
}

/**
 * Fungsi: runCommand
 * Parameter: sql (string query), params (array of parameters)
 * Return: Promise yang mengembalikan metadata eksekusi (lastID, changes)
 * Tujuan: Menjalankan perintah non-SELECT (INSERT, UPDATE, DELETE) dengan database SQLite.
 */
export function runCommand(sql, params = []) {
  // Membuat promise pembungkus fungsi asinkron database SQLite
  return new Promise((resolve, reject) => {
    // Fungsi database run() mengeksekusi query tanpa mengembalikan baris data
    db.run(sql, params, function (err) {
      // Jika terjadi error, kirim error ke handler reject
      if (err) reject(err);
      // Jika berhasil, kirim metadata seperti ID baris baru dan jumlah perubahan baris
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Mengekspor instance database default untuk kustomisasi lebih lanjut
export default db;
