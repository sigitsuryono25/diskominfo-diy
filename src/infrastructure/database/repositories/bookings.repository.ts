import { BookingsEntity, CancelBookingResult, IBookingRepository } from "../../../domain/entities/booking.entity";
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "../../../domain/exceptions/app.exceptions";
import { pool } from "../pool";

export class BookingsRepository implements IBookingRepository {
    async create(booking: BookingsEntity): Promise<BookingsEntity> {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const roomResult = await client.query<{ is_active: boolean }>(
                "SELECT is_active FROM rooms WHERE id = $1 FOR UPDATE",
                [booking.room_id],
            );
            const room = roomResult.rows[0];

            if (!room) {
                throw new NotFoundException("Ruangan tidak ditemukan");
            }
            if (!room.is_active) {
                throw new BadRequestException("Ruangan tidak aktif");
            }

            const conflictResult = await client.query(
                `SELECT 1
                 FROM bookings
                 WHERE room_id = $1
                   AND status = 'CONFIRMED'
                   AND start_time < $3::timestamptz
                   AND end_time > $2::timestamptz
                 LIMIT 1`,
                [booking.room_id, booking.start_time, booking.end_time],
            );

            if (conflictResult.rowCount) {
                throw new ConflictException("Ruangan sudah dipesan pada waktu tersebut", "ROOM_CONFLICT");
            }

            const result = await client.query<BookingsEntity>(
                `INSERT INTO bookings (room_id, user_id, title, start_time, end_time, status)
                 VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
                 RETURNING id, room_id, user_id, title, 
                           to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
                           to_char(end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
                           status`,
                [booking.room_id, booking.user_id, booking.title, booking.start_time, booking.end_time],
            );

            await client.query("COMMIT");
            return result.rows[0];
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async cancel(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<CancelBookingResult> {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            const result = await client.query<{ id: number; user_id: number; status: string }>(
                "SELECT id, user_id, status FROM bookings WHERE id = $1 FOR UPDATE",
                [id],
            );
            const booking = result.rows[0];

            if (!booking) {
                throw new NotFoundException("Pemesanan tidak ditemukan");
            }
            if (role !== 'ADMIN' && booking.user_id !== userId) {
                throw new ForbiddenException("Tidak memiliki akses untuk membatalkan pemesanan ini");
            }

            if (booking.status !== 'CANCELLED') {
                await client.query(
                    "UPDATE bookings SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
                    [id],
                );
            }

            await client.query("COMMIT");
            return { id: booking.id, status: 'CANCELLED' };
        } catch (error) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw error;
        } finally {
            client.release();
        }
    }

    async update(_id: number, _booking: BookingsEntity): Promise<BookingsEntity | null> {
        throw new Error("Method not implemented.");
    }

    async get(): Promise<BookingsEntity[]> {
        throw new Error("Method not implemented.");
    }

    async delete(_id: number): Promise<BookingsEntity | null> {
        throw new Error("Method not implemented.");
    }
}
