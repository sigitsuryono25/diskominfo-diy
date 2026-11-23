import { IRoomsRepository, RoomsEntity } from "../domain/entities/rooms.entity";
import { BadRequestException, NotFoundException } from "../domain/exceptions/app.exceptions";

export class RoomsUsecase {
    constructor(private roomsRepository: IRoomsRepository) { }

    async create(roomsEntity: RoomsEntity) {
        if (!roomsEntity.name || !roomsEntity.name.trim()) {
            throw new BadRequestException("Nama ruangan wajib diisi");
        }
        if (!Number.isInteger(roomsEntity.capacity) || roomsEntity.capacity <= 0) {
            throw new BadRequestException("Kapasitas ruangan harus integer positif");
        }
        return this.roomsRepository.create(roomsEntity);
    }

    async getAllRooms() {
        return this.roomsRepository.findAll();
    }

    async getRoomById(id: number) {
        const room = await this.roomsRepository.findById(id);
        if (!room) {
            throw new NotFoundException("Ruangan tidak ditemukan");
        }
        return room;
    }

    async updateRoom(id: number, roomsEntity: Partial<RoomsEntity>) {
        const room = await this.roomsRepository.findById(id);
        if (!room) {
            throw new NotFoundException("Ruangan tidak ditemukan");
        }
        return this.roomsRepository.update(id, roomsEntity);
    }

    async deleteRoom(id: number) {
        const room = await this.roomsRepository.findById(id);
        if (!room) {
            throw new NotFoundException("Ruangan tidak ditemukan");
        }
        return this.roomsRepository.delete(id);
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
            throw new BadRequestException("start dan end harus timestamp ISO-8601 UTC yang valid, dan start harus sebelum end", "INVALID_TIME");
        }

        return this.roomsRepository.getRoomAvailable(start, end);
    }
}
