import { BookingsEntity, CancelBookingResult, CreateBookingRequest, IBookingRepository } from "../domain/entities/booking.entity";
import { BadRequestException } from "../domain/exceptions/app.exceptions";

export class BookingsUsecase {
    constructor(private bookingsRepository: IBookingRepository) { }

    async create(request: CreateBookingRequest, userId: number): Promise<BookingsEntity> {
        const { room_id, title, start_time, end_time } = request ?? {};
        if (!Number.isInteger(room_id) || room_id <= 0 || typeof title !== "string" || !title.trim() || title.length > 150) {
            throw new BadRequestException("room_id dan title tidak valid");
        }

        const isUtcIsoTimestamp = (value: string) =>
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
            !Number.isNaN(Date.parse(value));

        const startTimestamp = Date.parse(start_time);
        const endTimestamp = Date.parse(end_time);
        if (
            !isUtcIsoTimestamp(start_time) ||
            !isUtcIsoTimestamp(end_time) ||
            endTimestamp <= startTimestamp ||
            startTimestamp < Date.now()
        ) {
            throw new BadRequestException("Waktu booking tidak valid atau sudah lewat", "INVALID_TIME");
        }

        return this.bookingsRepository.create({
            room_id,
            user_id: userId,
            title: title.trim(),
            start_time: new Date(startTimestamp),
            end_time: new Date(endTimestamp),
            status: "CONFIRMED",
        });
    }

    async cancel(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<CancelBookingResult> {
        if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException("ID pemesanan tidak valid");
        }

        return this.bookingsRepository.cancel(id, userId, role);
    }
}
