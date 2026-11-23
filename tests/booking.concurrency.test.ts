import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080/api/v1';

let runCounter = 1;

function getFutureSlot(offsetDays: number): { startTime: string; endTime: string } {
  // Gunakan offset hari bertambah + timestamp unik agar rentang waktu tidak pernah tumpang tindih dengan test sebelumnya
  const uniqueOffsetDays = offsetDays + Math.floor(Math.random() * 1000) + (runCounter++ * 5);
  const start = new Date(Date.now() + uniqueOffsetDays * 24 * 60 * 60 * 1000);
  start.setUTCHours(10, 0, 0, 0);
  return {
    startTime: start.toISOString(),
    endTime: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
  };
}

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

  const { startTime, endTime } = getFutureSlot(30);
  const overlappingStart = new Date(Date.parse(startTime) + 60 * 60 * 1000).toISOString();
  const overlappingEnd = new Date(Date.parse(endTime) + 60 * 60 * 1000).toISOString();

  // 1. Booking pertama berhasil
  const res1 = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      room_id: 1,
      title: 'Booking pertama',
      start_time: startTime,
      end_time: endTime,
    }),
  });

  const body1 = (await res1.json()) as { id?: number; status?: string; message?: string; error_code?: string };
  assert.equal(res1.status, 201, `Booking pertama harus berhasil dibuat (201): ${JSON.stringify(body1)}`);
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

  const { startTime: targetStartTime, endTime: targetEndTime } = getFutureSlot(60);
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
    const body = (await res.json()) as { error_code?: string };
    if (res.status === 409) {
      assert.equal(body.error_code, 'ROOM_CONFLICT');
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
