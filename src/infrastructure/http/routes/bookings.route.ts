import { FastifyInstance } from "fastify";
import { CreateBookingRequest, UpdateBookingRequest } from "../../../domain/entities/booking.entity";
import { BookingsRepository } from "../../database/repositories/bookings.repository";
import { BookingsUsecase } from "../../../usecases/bookings.usecase";
import { BookingsController } from "../controllers/bookings.controller";

export async function bookingsRoute(fastify: FastifyInstance) {
    const repository = new BookingsRepository();
    const usecase = new BookingsUsecase(repository);
    const controller = new BookingsController(usecase);

    // Bookings CRUD
    fastify.get("/", controller.getAll.bind(controller));
    fastify.get<{ Params: { id: string } }>("/:id", controller.getById.bind(controller));
    fastify.post<{ Body: CreateBookingRequest }>("/", controller.create.bind(controller));
    fastify.put<{ Params: { id: string }; Body: UpdateBookingRequest }>("/:id", controller.update.bind(controller));
    fastify.patch<{ Params: { id: string } }>("/:id/cancel", controller.cancel.bind(controller));
    fastify.delete<{ Params: { id: string } }>("/:id", controller.delete.bind(controller));
}
