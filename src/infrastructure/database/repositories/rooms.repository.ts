import { IRoomsRepository, RoomsEntity } from "../../../domain/entities/rooms.entity";
import { pool } from "../pool";

export class RoomsRepository implements IRoomsRepository {
    async create(roomsEntity: RoomsEntity): Promise<RoomsEntity> {
        const isActive = roomsEntity.is_active ?? true;
        const db = await pool.query(
            `INSERT INTO rooms (name, capacity, is_active)
            VALUES($1, $2, $3)
            RETURNING id, name, capacity, is_active
            `,
            [roomsEntity.name, roomsEntity.capacity, isActive]
        );

        return db.rows[0];
    }

    async findById(id: number): Promise<RoomsEntity | null> {
        const result = await pool.query<RoomsEntity>(
            `SELECT id, name, capacity, is_active, created_at, updated_at
             FROM rooms
             WHERE id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }

    async findAll(): Promise<RoomsEntity[]> {
        const result = await pool.query<RoomsEntity>(
            `SELECT id, name, capacity, is_active, created_at, updated_at
             FROM rooms
             ORDER BY id ASC`
        );
        return result.rows;
    }

    async update(id: number, roomsEntity: Partial<RoomsEntity>): Promise<RoomsEntity | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (roomsEntity.name !== undefined) {
            fields.push(`name = $${index++}`);
            values.push(roomsEntity.name);
        }
        if (roomsEntity.capacity !== undefined) {
            fields.push(`capacity = $${index++}`);
            values.push(roomsEntity.capacity);
        }
        if (roomsEntity.is_active !== undefined) {
            fields.push(`is_active = $${index++}`);
            values.push(roomsEntity.is_active);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query<RoomsEntity>(
            `UPDATE rooms
             SET ${fields.join(', ')}
             WHERE id = $${index}
             RETURNING id, name, capacity, is_active, created_at, updated_at`,
            values
        );

        return result.rows[0] || null;
    }

    async delete(id: number): Promise<boolean> {
        const result = await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }

    async getRoomAvailable(start: string, end: string): Promise<RoomsEntity[]> {
        const result = await pool.query<RoomsEntity>(
            `SELECT r.id, r.name, r.capacity
             FROM rooms r
             WHERE r.is_active = TRUE
               AND NOT EXISTS (
                   SELECT 1
                   FROM bookings b
                   WHERE b.room_id = r.id
                     AND b.status = 'CONFIRMED'
                     AND b.start_time < $2::timestamptz
                     AND b.end_time > $1::timestamptz
               )
             ORDER BY r.id ASC`,
            [start, end],
        );

        return result.rows;
    }
} 
