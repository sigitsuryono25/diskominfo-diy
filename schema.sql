-- Database Schema & Initial Seeder for Meeting Room Booking System
-- Diskominfo DIY Technical Assessment

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'USER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    room_id INT NOT NULL REFERENCES rooms (id) ON DELETE RESTRICT,
    user_id INT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (
        status IN ('CONFIRMED', 'CANCELLED')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance and query optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms (is_active);

CREATE INDEX IF NOT EXISTS idx_bookings_room_status ON bookings (room_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON bookings (
    room_id,
    status,
    start_time,
    end_time
);

-- 2. Seed Initial Users (Wajib dari Soal)
-- Password for all accounts is 'password123'
INSERT INTO
    users (
        id,
        name,
        email,
        password_hash,
        role
    )
VALUES (
        1,
        'Administrator',
        'admin@test.com',
        '$2b$10$L9BwAC2v1nWsLbU2XtRZ/u8czSP0toDebe1W0J7zcBsvbagrNRhV2',
        'ADMIN'
    ),
    (
        2,
        'User Satu',
        'user1@test.com',
        '$2b$10$L9BwAC2v1nWsLbU2XtRZ/u8czSP0toDebe1W0J7zcBsvbagrNRhV2',
        'USER'
    ),
    (
        3,
        'User Dua',
        'user2@test.com',
        '$2b$10$L9BwAC2v1nWsLbU2XtRZ/u8czSP0toDebe1W0J7zcBsvbagrNRhV2',
        'USER'
    )
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1))
FROM users;

-- 3. Seed Rooms (Sebagai referensi foreign key booking)
INSERT INTO
    rooms (id, name, capacity, is_active)
VALUES (1, 'Ruang Garuda', 10, TRUE),
    (2, 'Ruang Merapi', 20, TRUE),
    (3, 'Ruang Malioboro', 6, TRUE),
    (
        4,
        'Ruang Pemeliharaan (Nonaktif)',
        8,
        FALSE
    )
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('rooms', 'id'), COALESCE(MAX(id), 1))
FROM rooms;

-- 4. Seed Data Bookings
-- Mencakup contoh:
-- a. Booking bulan berjalan (untuk ngetes query analitik rekap pemakaian ruangan)
-- b. Booking pada tanggal tertentu (untuk ngetes query/endpoint ruangan tersedia & cek overlap)
-- c. Booking status CANCELLED (untuk memastikan filter status CONFIRMED berfungsi)
INSERT INTO
    bookings (
        room_id,
        user_id,
        title,
        start_time,
        end_time,
        status
    )
VALUES
    -- Ruang Garuda (id: 1) - Booking pada bulan berjalan (2 jam)
    (
        1,
        2,
        'Sprint Planning Q1',
        DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '2 days 09:00:00',
        DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '2 days 11:00:00',
        'CONFIRMED'
    ),
    -- Ruang Garuda (id: 1) - Booking bentrok / contoh soal 2026-12-01
    (
        1,
        2,
        'Tech Sync Diskominfo',
        '2026-12-01 10:00:00+00',
        '2026-12-01 12:00:00+00',
        'CONFIRMED'
    ),
    -- Ruang Merapi (id: 2) - Booking bulan berjalan (3 jam)
    (
        2,
        3,
        'Workshop Arsitektur Microservices',
        DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '5 days 13:00:00',
        DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '5 days 16:00:00',
        'CONFIRMED'
    ),
    -- Ruang Malioboro (id: 3) - Booking CANCELLED (tidak boleh masuk hitungan jam & ketersediaan)
    (
        3,
        2,
        'Koordinasi Internal (Dibatalkan)',
        '2026-12-01 10:00:00+00',
        '2026-12-01 11:30:00+00',
        'CANCELLED'
    )
ON CONFLICT DO NOTHING;
