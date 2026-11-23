import { FastifyReply, FastifyRequest } from "fastify";
import { CreateBookingRequest } from "../../../domain/entities/booking.entity";
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
}
