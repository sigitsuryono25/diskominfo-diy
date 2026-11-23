import { IRoomsRepository, RoomsEntity } from "../../../domain/entities/rooms.entity";
import { pool } from "../pool";

export class RoomsRepository implements IRoomsRepository {
    async create(roomsEntity: RoomsEntity): Promise<RoomsEntity> {
        const db = await pool.query(
            `INSERT INTO rooms (name, capacity, is_active)
            VALUES($1, $2, $3)
            RETURNING id, name, capacity, is_active, created_at, updated_at
            `
            , [roomsEntity.name, roomsEntity.capacity, roomsEntity.is_active]);

        return db.rows[0];
    }
    update(id: number, roomsEntity: RoomsEntity): Promise<RoomsEntity | null> {
        throw new Error("Method not implemented.");
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
