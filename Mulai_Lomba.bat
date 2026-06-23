@echo off
title Smart Competition Manager - Launcher
color 0b
echo ====================================================
echo        MEMULAI SISTEM SMART COMPETITION MANAGER
echo ====================================================
echo.
echo [1/3] Mempersiapkan Server Database...
start "SCM Backend Server" cmd /k "cd /d %~dp0server && npm start"

echo [2/3] Mempersiapkan Layar Visual (React)...
start "SCM Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Menunggu sistem memuat (sekitar 5 detik)...
timeout /t 5 /nobreak > nul

echo.
echo [3/3] Membuka Browser Otomatis...
start http://localhost:5173/display
timeout /t 1 /nobreak > nul
start http://localhost:5173/operator

echo.
echo ====================================================
echo                 SISTEM BERHASIL AKTIF!
echo ====================================================
echo.
echo PENTING UNTUK PANITIA:
echo 1. Akan ada 2 jendela hitam (terminal) yang terbuka di layar.
echo 2. BIARKAN SAJA jendela hitam tersebut (TOLONG JANGAN DITUTUP).
echo 3. Meminimize (memperkecil) jendela hitam diperbolehkan.
echo 4. Jika jendela hitam ditutup, aplikasi lomba akan mati (error).
echo.
echo Jendela hijau ini sudah boleh Anda tutup (silang).
echo Semoga lombanya berjalan lancar!
echo.
pause
