-- Tugas Bagian A: Query SQL Analitik
-- Studi Kasus: Sistem Booking Ruang Meeting - Diskominfo DIY

-- 1. Rekap Jam Pemakaian Ruangan:
-- Menampilkan room_id, name, dan total durasi pemakaian (dalam satuan jam)
-- untuk setiap ruangan pada bulan berjalan. Hanya hitung transaksi yang berstatus CONFIRMED.
-- Catatan: Menggunakan LEFT JOIN agar ruangan yang belum dipakai tetap terdata (durasi 0).
-- EXTRACT(EPOCH FROM (b.end_time - b.start_time)) akan menghasilkan selisih dalam bentuk second
-- hasil dari EXTRACT(EPOCH ....) dibagi dengan 3600.0 lalu dijumlahkan dengan ketelitian 2 angka dibelakang koma
-- lalu hasil penjumlahan tersebut di ROUND
-- DATE_TRUNC truncate tanggal dan jam sampai awal bulan dari current timestamp. jadi
-- DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month', tanggal dan jam awal bulan sekarang +  inverval 1 bulan
SELECT r.id AS room_id, r.name, COALESCE(
        ROUND(
            SUM(
                EXTRACT(
                    EPOCH
                    FROM (b.end_time - b.start_time)
                ) / 3600.0
            )::numeric, 2
        ), 0
    ) AS total_hours
FROM
    rooms r
    LEFT JOIN bookings b ON r.id = b.room_id
    AND b.status = 'CONFIRMED'
    AND b.start_time >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
    AND b.start_time < (
        DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
    )
GROUP BY
    r.id,
    r.name
ORDER BY r.id ASC;

-- 2. Pencarian Ruangan Tersedia:
-- Menampilkan daftar seluruh ruangan aktif (is_active = true) yang tidak memiliki jadwal
-- CONFIRMED yang beririsan pada rentang waktu tertentu.
-- Contoh rentang waktu: 2026-12-01 10:00:00+00 s/d 2026-12-01 12:00:00+00 (asumsi data dikirim menggunakan UTC format)
-- Logika iris: existing.start_time < :target_end AND existing.end_time > :target_start
-- subquery akan mereturn baris jika ada kondisi yang terpenuhi
SELECT r.id, r.name, r.capacity
FROM rooms r
WHERE
    r.is_active = TRUE
    AND NOT EXISTS (
        SELECT *
        FROM bookings b
        WHERE
            b.room_id = r.id
            AND b.status = 'CONFIRMED'
            AND b.start_time < '2026-12-01 12:00:00+00'::timestamptz -- timestamp with 'UTC'
            AND b.end_time > '2026-12-01 10:00:00+00'::timestamptz -- timestamp with 'UTC'
    )
ORDER BY r.id ASC;