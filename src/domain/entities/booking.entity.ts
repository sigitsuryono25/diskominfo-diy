export interface BookingsEntity {
    id?: number;
    room_id: number;
    user_id: number;
    title: string;
    start_time: string | Date;
    end_time: string | Date;
    status: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateBookingRequest {
    room_id: number;
    title: string;
    start_time: string;
    end_time: string;
}

export interface UpdateBookingRequest {
    title?: string;
    room_id?: number;
    start_time?: string;
    end_time?: string;
}

export interface CancelBookingResult {
    id: number;
    status: 'CANCELLED';
}

export interface IBookingRepository {
    create(bookingsEntity: BookingsEntity): Promise<BookingsEntity>;
    findById(id: number): Promise<BookingsEntity | null>;
    findAll(userId?: number, role?: 'ADMIN' | 'USER'): Promise<BookingsEntity[]>;
    cancel(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<CancelBookingResult>;
    update(id: number, booking: Partial<BookingsEntity>): Promise<BookingsEntity | null>;
    delete(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<boolean>;
}
