import { IUserRepository, UserResponse, UsersEntity } from "../../../domain/entities/users.entity";
import { pool } from "../pool";

export class UserRepository implements IUserRepository {
    async findByEmail(email: string): Promise<UsersEntity | null> {
        const result = await pool.query<UsersEntity>(
            `SELECT id, name, email, password_hash, role, created_at, updated_at
             FROM users
             WHERE email = $1
             LIMIT 1`,
            [email.trim().toLowerCase()]
        );

        return result.rows[0] || null;
    }

    async findById(id: number): Promise<UsersEntity | null> {
        const result = await pool.query<UsersEntity>(
            `SELECT id, name, email, password_hash, role, created_at, updated_at
             FROM users
             WHERE id = $1
             LIMIT 1`,
            [id]
        );

        return result.rows[0] || null;
    }

    async findAll(): Promise<UserResponse[]> {
        const result = await pool.query<UserResponse>(
            `SELECT id, name, email, role, created_at, updated_at
             FROM users
             ORDER BY id ASC`
        );
        return result.rows;
    }

    async create(user: Omit<UsersEntity, 'id'>): Promise<UserResponse> {
        const result = await pool.query<UserResponse>(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, role, created_at, updated_at`,
            [user.name, user.email.toLowerCase(), user.password_hash, user.role]
        );
        return result.rows[0];
    }

    async update(id: number, user: Partial<UsersEntity>): Promise<UserResponse | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (user.name !== undefined) {
            fields.push(`name = $${index++}`);
            values.push(user.name);
        }
        if (user.email !== undefined) {
            fields.push(`email = $${index++}`);
            values.push(user.email.toLowerCase());
        }
        if (user.password_hash !== undefined) {
            fields.push(`password_hash = $${index++}`);
            values.push(user.password_hash);
        }
        if (user.role !== undefined) {
            fields.push(`role = $${index++}`);
            values.push(user.role);
        }

        if (fields.length === 0) {
            const current = await this.findById(id);
            if (!current) return null;
            const { password_hash, ...rest } = current;
            return rest;
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query<UserResponse>(
            `UPDATE users
             SET ${fields.join(', ')}
             WHERE id = $${index}
             RETURNING id, name, email, role, created_at, updated_at`,
            values
        );

        return result.rows[0] || null;
    }

    async delete(id: number): Promise<boolean> {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
}