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
    title: string;
    start_time: string;
    end_time: string;
}

export interface CancelBookingResult {
    id: number;
    status: 'CANCELLED';
}


export interface IBookingRepository {
    create(bookingsEntity: BookingsEntity): Promise<BookingsEntity>
    cancel(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<CancelBookingResult>
    update(id: number, bookingsEntity: BookingsEntity): Promise<BookingsEntity | null>
    get(): Promise<BookingsEntity[]>
    delete(id: number): Promise<BookingsEntity | null>
}
