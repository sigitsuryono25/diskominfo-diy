export interface RoomsEntity {
    id?: number;
    name: string;
    capacity: number;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}


export interface IRoomsRepository {
    create(roomsEntity: RoomsEntity): Promise<RoomsEntity>
    update(id: number, roomsEntity: RoomsEntity): Promise<RoomsEntity | null>
    getRoomAvailable(start: string, end: string): Promise<RoomsEntity[]>
}
