import { IUserRepository, UsersEntity } from "../../../domain/entities/users.entity";
import { pool } from "../pool";

export class UserRepository implements IUserRepository {
    async findByEmail(email: string): Promise<UsersEntity> {
        const result = await pool.query<UsersEntity>(
            `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = $1
       LIMIT 1`,
            [email.trim().toLowerCase()]
        )

        return result.rows[0];
    }

}