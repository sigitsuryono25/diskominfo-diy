import { BookingsEntity, CancelBookingResult, CreateBookingRequest, IBookingRepository, UpdateBookingRequest } from "../domain/entities/booking.entity";
import { BadRequestException, ForbiddenException, NotFoundException } from "../domain/exceptions/app.exceptions";

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

    async getAllBookings(userId: number, role: 'ADMIN' | 'USER'): Promise<BookingsEntity[]> {
        return this.bookingsRepository.findAll(userId, role);
    }

    async getBookingById(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<BookingsEntity> {
        const booking = await this.bookingsRepository.findById(id);
        if (!booking) {
            throw new NotFoundException("Pemesanan tidak ditemukan");
        }
        if (role !== 'ADMIN' && booking.user_id !== userId) {
            throw new ForbiddenException("Tidak memiliki akses ke pemesanan ini");
        }
        return booking;
    }

    async updateBooking(id: number, request: UpdateBookingRequest, userId: number, role: 'ADMIN' | 'USER'): Promise<BookingsEntity> {
        const booking = await this.bookingsRepository.findById(id);
        if (!booking) {
            throw new NotFoundException("Pemesanan tidak ditemukan");
        }
        if (role !== 'ADMIN' && booking.user_id !== userId) {
            throw new ForbiddenException("Tidak memiliki akses mengubah pemesanan ini");
        }

        const updateData: Partial<BookingsEntity> = {};
        if (request.title) updateData.title = request.title.trim();
        if (request.start_time) updateData.start_time = request.start_time;
        if (request.end_time) updateData.end_time = request.end_time;

        const updated = await this.bookingsRepository.update(id, updateData);
        if (!updated) {
            throw new NotFoundException("Gagal mengupdate pemesanan");
        }
        return updated;
    }

    async cancel(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<CancelBookingResult> {
        if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException("ID pemesanan tidak valid");
        }

        return this.bookingsRepository.cancel(id, userId, role);
    }

    async deleteBooking(id: number, userId: number, role: 'ADMIN' | 'USER'): Promise<void> {
        const booking = await this.bookingsRepository.findById(id);
        if (!booking) {
            throw new NotFoundException("Pemesanan tidak ditemukan");
        }
        if (role !== 'ADMIN' && booking.user_id !== userId) {
            throw new ForbiddenException("Tidak memiliki akses menghapus pemesanan ini");
        }
        await this.bookingsRepository.delete(id, userId, role);
    }
}
