export interface UsersEntity {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: 'ADMIN' | 'USER';
    created_at?: Date;
    updated_at?: Date;
}

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'USER';
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    password?: string;
    role?: 'ADMIN' | 'USER';
}

export interface UserRequest {
    email: string;
    password: string;
}

export interface IUserRepository {
    findByEmail(email: string): Promise<UsersEntity | null>;
    findById(id: number): Promise<UsersEntity | null>;
    findAll(): Promise<UserResponse[]>;
    create(user: Omit<UsersEntity, 'id'>): Promise<UserResponse>;
    update(id: number, user: Partial<UsersEntity>): Promise<UserResponse | null>;
    delete(id: number): Promise<boolean>;
}