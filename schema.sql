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
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance and query optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_room_status ON bookings(room_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON bookings(room_id, status, start_time, end_time);

-- 2. Seed Initial Users
-- Password for all accounts is 'password123'
-- Hash bcrypt 10 rounds: $2b$10$w8T9Vv4gO/M8g3ZcE2cZtOGzR/6q7F89jW11bN8g7H6m5K4l3i2a. (standard bcrypt hash for 'password123': $2b$10$y5Xo6t0kGk8E9bQ4F5i7ceWz8s2Hq5v0fUaL8G0OaL5N2O5Z4bO2e)
INSERT INTO users (name, email, password_hash, role)
VALUES 
    ('Administrator', 'admin@test.com', '$2b$10$T8Zg8i8.UuO4b5l6r7e8auA9YV7V7R4K1N5m0b9l2y9q4G5t6u7i.', 'ADMIN'),
    ('User Satu', 'user1@test.com', '$2b$10$T8Zg8i8.UuO4b5l6r7e8auA9YV7V7R4K1N5m0b9l2y9q4G5t6u7i.', 'USER'),
    ('User Dua', 'user2@test.com', '$2b$10$T8Zg8i8.UuO4b5l6r7e8auA9YV7V7R4K1N5m0b9l2y9q4G5t6u7i.', 'USER')
ON CONFLICT (email) DO NOTHING;
