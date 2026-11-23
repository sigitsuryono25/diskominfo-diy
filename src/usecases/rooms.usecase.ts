import { IRoomsRepository, RoomsEntity } from "../domain/entities/rooms.entity";
import { BadRequestException } from "../domain/exceptions/app.exceptions";

export class RoomsUsecase {
    constructor(private roomsRepository: IRoomsRepository) { }

    async create(roomsEntity: RoomsEntity) {
        return this.roomsRepository.create(roomsEntity)
    }

    async getAvailableRooms(start: string, end: string) {
        if (!start || !end) {
            throw new BadRequestException("Query start dan end wajib diisi");
        }

        const startTime = Date.parse(start);
        const endTime = Date.parse(end);
        const isUtcIsoTimestamp = (value: string) =>
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
            !Number.isNaN(Date.parse(value));

        if (
            !isUtcIsoTimestamp(start) ||
            !isUtcIsoTimestamp(end) ||
            startTime >= endTime
        ) {
            throw new BadRequestException("start dan end harus timestamp ISO-8601 UTC yang valid, dan start harus sebelum end");
        }

        return this.roomsRepository.getRoomAvailable(start, end);
    }
}
