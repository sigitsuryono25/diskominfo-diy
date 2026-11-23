export interface UsersEntity {
    id?: number;
    name: string;
    email: string;
    password_hash: string;
    role: 'ADMIN' | 'USER';
    created_at?: Date;
    updated_at?: Date;
}
