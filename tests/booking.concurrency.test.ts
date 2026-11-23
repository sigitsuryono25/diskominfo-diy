import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080/api/v1';

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = (await response.json()) as { token?: string; message?: string };
  assert.equal(response.status, 200, `Login failed: ${body.message || response.statusText}`);
  assert.ok(body.token, 'Token should be returned');
  return body.token;
}

test('Skenario 1: Konflik Jadwal Bentrok (Sequential Overlap Test)', async () => {
  const token = await login('user1@test.com', 'password123');

  // Menggunakan rentang waktu di masa depan (2027) agar selalu valid
  const startTime = '2027-06-15T09:00:00Z';
  const endTime = '2027-06-15T11:00:00Z';
  const overlappingStart = '2027-06-15T10:00:00Z';
  const overlappingEnd = '2027-06-15T12:00:00Z';

  // 1. Booking pertama berhasil
  const res1 = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      room_id: 1,
      title: 'Booking Pertama',
      start_time: startTime,
      end_time: endTime,
    }),
  });

  const body1 = (await res1.json()) as { id?: number; status?: string };
  assert.equal(res1.status, 201, 'Booking pertama harus berhasil dibuat (201)');
  assert.equal(body1.status, 'CONFIRMED');

  // 2. Booking kedua bentrok dengan booking pertama
  const res2 = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      room_id: 1,
      title: 'Booking Kedua (Bentrok)',
      start_time: overlappingStart,
      end_time: overlappingEnd,
    }),
  });

  const body2 = (await res2.json()) as { error_code?: string; message?: string };
  assert.equal(res2.status, 409, 'Booking bentrok harus menghasilkan status 409 Conflict');
  assert.equal(body2.error_code, 'ROOM_CONFLICT', 'Error code harus ROOM_CONFLICT');
});

test('Skenario 2: Concurrency & Race Condition Test (10 Concurrent Requests)', async () => {
  const token = await login('user2@test.com', 'password123');

  // Menggunakan slot waktu spesifik di masa depan
  const targetStartTime = '2027-07-20T14:00:00Z';
  const targetEndTime = '2027-07-20T16:00:00Z';
  const totalConcurrentRequests = 10;

  // Siapkan 10 permintaan serentak untuk ruangan dan jam yang sama
  const requests = Array.from({ length: totalConcurrentRequests }, (_, index) =>
    fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        room_id: 2, // Menggunakan Ruang Merapi (id: 2)
        title: `Concurrent Booking Attempt #${index + 1}`,
        start_time: targetStartTime,
        end_time: targetEndTime,
      }),
    })
  );

  // Jalankan seluruh request secara paralel serentak
  const responses = await Promise.all(requests);
  const statusCounts: Record<number, number> = {};

  for (const res of responses) {
    statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
    if (res.status === 409) {
      const errorBody = (await res.json()) as { error_code?: string };
      assert.equal(errorBody.error_code, 'ROOM_CONFLICT');
    }
  }

  // Evaluasi aturan bisnis:
  // Tepat 1 berhasil (201 Created) dan sisanya ditolak (409 Conflict)
  assert.equal(statusCounts[201], 1, 'Tepat 1 permintaan harus berhasil (HTTP 201)');
  assert.equal(
    statusCounts[409],
    totalConcurrentRequests - 1,
    `Tepat ${totalConcurrentRequests - 1} permintaan lainnya harus ditolak karena konflik (HTTP 409)`
  );
});
