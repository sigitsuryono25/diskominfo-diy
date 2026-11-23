import { FastifyInstance } from "fastify";
import { CreateBookingRequest } from "../../../domain/entities/booking.entity";
import { BookingsRepository } from "../../database/repositories/bookings.repository";
import { BookingsUsecase } from "../../../usecases/bookings.usecase";
import { BookingsController } from "../controllers/bookings.controller";

export async function bookingsRoute(fastify: FastifyInstance) {
    const repository = new BookingsRepository();
    const usecase = new BookingsUsecase(repository);
    const controller = new BookingsController(usecase);

    fastify.post<{ Body: CreateBookingRequest }>("/", controller.create.bind(controller));
    fastify.patch<{ Params: { id: string } }>("/:id/cancel", controller.cancel.bind(controller));
}
