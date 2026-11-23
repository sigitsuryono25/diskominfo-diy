-- Tugas Bagian A: Query SQL Analitik
-- Studi Kasus: Sistem Booking Ruang Meeting - Diskominfo DIY

-- 1. Rekap jam pemakaian yang benar-benar jatuh di bulan berjalan.
-- Booking yang melintasi batas bulan hanya dihitung untuk bagian yang overlap dengan bulan ini.
SELECT r.id AS room_id, r.name, COALESCE(
        ROUND(
            SUM(
                EXTRACT(
                    EPOCH
                    FROM (
                        LEAST(b.end_time, DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month')
                        - GREATEST(b.start_time, DATE_TRUNC('month', CURRENT_TIMESTAMP))
                    )
                ) / 3600.0
            )::numeric, 2
        ), 0
    ) AS total_hours
FROM
    rooms r
    LEFT JOIN bookings b ON r.id = b.room_id
    AND b.status = 'CONFIRMED'
    AND b.start_time < DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
    AND b.end_time > DATE_TRUNC('month', CURRENT_TIMESTAMP)
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
