export interface RoomsEntity {
    id?: number;
    name: string;
    capacity: number;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface IRoomsRepository {
    create(roomsEntity: RoomsEntity): Promise<RoomsEntity>;
    findById(id: number): Promise<RoomsEntity | null>;
    findAll(): Promise<RoomsEntity[]>;
    update(id: number, roomsEntity: Partial<RoomsEntity>): Promise<RoomsEntity | null>;
    delete(id: number): Promise<boolean>;
    getRoomAvailable(start: string, end: string): Promise<RoomsEntity[]>;
}
