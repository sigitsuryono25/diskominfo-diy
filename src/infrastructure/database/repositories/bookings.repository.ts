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

    async findById(id: number): Promise<BookingsEntity | null> {
        const result = await pool.query<BookingsEntity>(
            `SELECT id, room_id, user_id, title,
                    to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
                    to_char(end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
                    status, created_at, updated_at
             FROM bookings
             WHERE id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }

    async findAll(userId?: number, role?: 'ADMIN' | 'USER'): Promise<BookingsEntity[]> {
        let query = `
            SELECT id, room_id, user_id, title,
                   to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
                   to_char(end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
                   status, created_at, updated_at
            FROM bookings
        `;
        const params: any[] = [];
        if (role !== 'ADMIN' && userId) {
            query += ` WHERE user_id = $1`;
            params.push(userId);
        }
        query += ` ORDER BY id DESC`;

        const result = await pool.query<BookingsEntity>(query, params);
        return result.rows;
    }

    async update(id: number, booking: Partial<BookingsEntity>): Promise<BookingsEntity | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (booking.title !== undefined) {
            fields.push(`title = $${index++}`);
            values.push(booking.title);
        }
        if (booking.room_id !== undefined) {
            fields.push(`room_id = $${index++}`);
            values.push(booking.room_id);
        }
        if (booking.start_time !== undefined) {
            fields.push(`start_time = $${index++}`);
            values.push(booking.start_time);
        }
        if (booking.end_time !== undefined) {
            fields.push(`end_time = $${index++}`);
            values.push(booking.end_time);
        }
        if (booking.status !== undefined) {
            fields.push(`status = $${index++}`);
            values.push(booking.status);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query<BookingsEntity>(
            `UPDATE bookings
             SET ${fields.join(', ')}
             WHERE id = $${index}
             RETURNING id, room_id, user_id, title,
                       to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
                       to_char(end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
                       status, created_at, updated_at`,
            values
        );

        return result.rows[0] || null;
    }

    async delete(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<boolean> {
        let query = 'DELETE FROM bookings WHERE id = $1';
        const params: any[] = [id];

        if (role !== 'ADMIN') {
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const result = await pool.query(query, params);
        return (result.rowCount ?? 0) > 0;
    }
}
