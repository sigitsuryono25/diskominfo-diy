# Sistem Booking Ruang Meeting - Diskominfo DIY

Layanan RESTful API pemesanan ruang rapat perusahaan dengan pencegahan *double booking* (*concurrency & race condition handling*) menggunakan Database Transaction dan Pessimistic Row Locking (`SELECT ... FOR UPDATE`). Dibangun menggunakan **Fastify**, **TypeScript**, dan **PostgreSQL** dengan arsitektur **Clean Architecture**.

---

## Daftar Isi
1. [Fitur & Arsitektur](#fitur--arsitektur)
2. [Prasyarat](#prasyarat)
3. [Instruksi Menjalankan via Docker](#instruksi-menjalankan-via-docker)
4. [Menjalankan Aplikasi Secara Lokal (Development)](#menjalankan-aplikasi-secara-lokal-development)
5. [Menjalankan Pengujian Otomatis (Automated Testing)](#menjalankan-pengujian-otomatis-automated-testing)
6. [Contoh Perintah cURL Lengkap](#contoh-perintah-curl-lengkap)
7. [Akun Awal (Seeder Data)](#akun-awal-seeder-data)

---

## Fitur & Arsitektur

- **Clean Architecture**: Pemisahan lapisan yang jelas antara *Domain (Entities & Interfaces)*, *Use Cases (Business Logic)*, dan *Infrastructure (Fastify HTTP, Controllers, Middlewares, PostgreSQL)*.
- **Concurrency & Race Condition Handling**: Menggunakan isolasi database transaction dan pessimistic locking (`FOR UPDATE`) pada tabel `rooms` saat proses pengecekan tumpang tindih waktu booking.
- **RESTful API Contract Compliance**: Format response sukses dan standar error (`error_code`, `message`) persis mengikuti spesifikasi teknis.

---

## Prasyarat

- [Docker](https://www.docker.com/) & Docker Compose
- Atau [Node.js](https://nodejs.org/) (v20+) dan PostgreSQL (v14+) jika dijalankan lokal.

---

## Instruksi Menjalankan via Docker

Aplikasi dan database PostgreSQL sudah dikonfigurasi menggunakan `docker-compose.yml` dan `schema.sql` (otomatis mengeksekusi migrasi tabel dan seeding data awal).

1. **Jalankan container**:
   ```bash
   docker-compose up -d --build
   ```
2. **Cek status container**:
   ```bash
   docker-compose ps
   ```
3. **Cek log aplikasi**:
   ```bash
   docker-compose logs -f app
   ```
4. **Hentikan layanan**:
   ```bash
   docker-compose down
   ```
   *(Gunakan flag `-v` jika ingin menghapus volume database: `docker-compose down -v`)*.

Layanan HTTP aktif di: **`http://localhost:8080`**

---

## Menjalankan Aplikasi Secara Lokal (Development)

1. Pastikan PostgreSQL lokal menyala dan import schema:
   ```bash
   psql -U postgres -d booking_db -f schema.sql
   ```
2. Buat file `.env` dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Install dependensi dan jalankan server:
   ```bash
   npm install
   npm run dev
   ```

---

## Menjalankan Pengujian Otomatis (Automated Testing)

File pengujian `tests/booking.concurrency.test.ts` menguji:
1. **Skenario Jadwal Bentrok**: Memverifikasi booking beririsan ditolak dengan status HTTP `409` dan `error_code: "ROOM_CONFLICT"`.
2. **Skenario Concurrency & Race Condition**: Mengirim 10 permintaan paralel serentak menggunakan `Promise.all` ke slot ruangan yang sama, memvalidasi tepat 1 request berhasil (`201`) dan 9 lainnya ditolak (`409`).

Pastikan aplikasi sudah berjalan di `http://localhost:8080`, lalu jalankan:

```bash
npm test
```

*Catatan: Anda juga dapat menentukan URL target menggunakan environment variable `BASE_URL`:*
```bash
BASE_URL=http://localhost:8080/api/v1 npm test
```

---

## Contoh Perintah cURL Lengkap

Base URL: `http://localhost:8080/api/v1`

### 1. Autentikasi Pengguna (Login)
Mendapatkan token JWT untuk mengakses endpoint terproteksi.

**Request (User):**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "password123"
  }'
```

**Request (Admin):**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

---

### 2. Tambah Ruang Meeting (Khusus ADMIN)
Header wajib menyertakan token Admin. Jika diakses oleh `USER`, akan ditolak `403 Forbidden`.

```bash
curl -X POST http://localhost:8080/api/v1/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "name": "Ruang Garuda",
    "capacity": 10
  }'
```

---

### 3. Cek Ketersediaan Ruangan
Mendapatkan daftar ruangan aktif yang tidak memiliki jadwal bentrok pada rentang waktu yang diminta.

```bash
curl -X GET "http://localhost:8080/api/v1/rooms/available?start=2026-12-01T10:00:00Z&end=2026-12-01T12:00:00Z" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

### 4. Buat Pemesanan Ruangan
Membuat pemesanan baru. Sistem memvalidasi waktu, status ruangan aktif, dan konflik jadwal.

```bash
curl -X POST http://localhost:8080/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "room_id": 1,
    "title": "Sprint Planning",
    "start_time": "2026-12-01T10:00:00Z",
    "end_time": "2026-12-01T12:00:00Z"
  }'
```

---

### 5. Pembatalan Pemesanan
Membatalkan pemesanan yang ada. Hanya pemilik pesanan atau `ADMIN` yang diizinkan membatalkan.

```bash
curl -X PATCH http://localhost:8080/api/v1/bookings/1/cancel \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Akun Awal (Seeder Data)

| Nama | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| Administrator | `admin@test.com` | `password123` | `ADMIN` |
| User Satu | `user1@test.com` | `password123` | `USER` |
| User Dua | `user2@test.com` | `password123` | `USER` |
