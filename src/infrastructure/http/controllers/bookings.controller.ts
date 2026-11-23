import { FastifyReply, FastifyRequest } from "fastify";
import { CreateBookingRequest, UpdateBookingRequest } from "../../../domain/entities/booking.entity";
import { UnauthorizedException } from "../../../domain/exceptions/app.exceptions";
import { BookingsUsecase } from "../../../usecases/bookings.usecase";

export class BookingsController {
    constructor(private bookingsUsecase: BookingsUsecase) { }

    async create(request: FastifyRequest<{ Body: CreateBookingRequest }>, reply: FastifyReply) {
        if (!request.user) {
            throw new UnauthorizedException("Token autentikasi tidak valid atau tidak tersedia");
        }

        const booking = await this.bookingsUsecase.create(request.body, request.user.id);
        return reply.status(201).send({
            ...booking,
            start_time: new Date(booking.start_time).toISOString(),
            end_time: new Date(booking.end_time).toISOString(),
        });
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        if (!request.user) {
            throw new UnauthorizedException("Token autentikasi tidak valid atau tidak tersedia");
        }
        const bookings = await this.bookingsUsecase.getAllBookings(request.user.id, request.user.role);
        return reply.status(200).send({ data: bookings });
    }

    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        if (!request.user) {
            throw new UnauthorizedException("Token autentikasi tidak valid atau tidak tersedia");
        }
        const booking = await this.bookingsUsecase.getBookingById(
            Number(request.params.id),
            request.user.id,
            request.user.role
        );
        return reply.status(200).send(booking);
    }

    async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateBookingRequest }>, reply: FastifyReply) {
        if (!request.user) {
            throw new UnauthorizedException("Token autentikasi tidak valid atau tidak tersedia");
        }
        const booking = await this.bookingsUsecase.updateBooking(
            Number(request.params.id),
            request.body,
            request.user.id,
            request.user.role
        );
        return reply.status(200).send(booking);
    }

    async cancel(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        if (!request.user) {
            throw new UnauthorizedException("Token autentikasi tidak valid atau tidak tersedia");
        }

        const result = await this.bookingsUsecase.cancel(
            Number(request.params.id),
            request.user.id,
            request.user.role,
        );
        return reply.status(200).send(result);
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        if (!request.user) {
            throw new UnauthorizedException("Token autentikasi tidak valid atau tidak tersedia");
        }
        await this.bookingsUsecase.deleteBooking(
            Number(request.params.id),
            request.user.id,
            request.user.role
        );
        return reply.status(200).send({ message: "Pemesanan berhasil dihapus" });
    }
}
