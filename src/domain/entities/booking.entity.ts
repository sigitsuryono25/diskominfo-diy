export interface BookingsEntity {
    id?: number;
    room_id: number;
    user_id: number;
    title: string;
    start_time: Date;
    end_time: Date;
    status: string;
    created_at?: Date;
    updated_at?: Date;
}


export interface IBookingRepository {
    create(bookingsEntity: BookingsEntity): Promise<BookingsEntity>
    update(id: number, bookingsEntity: BookingsEntity): Promise<BookingsEntity | null>
    get(): Promise<BookingsEntity[]>
    delete(id: number): Promise<BookingsEntity | null>
}