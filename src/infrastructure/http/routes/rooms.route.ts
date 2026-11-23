import { FastifyInstance } from "fastify";
import { RoomsRepository } from "../../database/repositories/rooms.repository";
import { RoomsUsecase } from "../../../usecases/rooms.usecase";
import { RoomsController } from "../controllers/rooms.controller";
import { requireAdmin } from "../middlewares/auth.middleware";
import { RoomsEntity } from "../../../domain/entities/rooms.entity";

export async function roomsRoute(fastify: FastifyInstance) {
    const repo = new RoomsRepository();
    const useCase = new RoomsUsecase(repo);
    const controller = new RoomsController(useCase);

    // Specific route first
    fastify.get<{ Querystring: { start: string; end: string } }>("/available", controller.getAvailable.bind(controller));

    // Rooms CRUD
    fastify.get("/", controller.getAll.bind(controller));
    fastify.get<{ Params: { id: string } }>("/:id", controller.getById.bind(controller));
    fastify.post<{ Body: RoomsEntity }>("/", { preHandler: requireAdmin }, controller.create.bind(controller));
    fastify.put<{ Params: { id: string }; Body: Partial<RoomsEntity> }>("/:id", { preHandler: requireAdmin }, controller.update.bind(controller));
    fastify.delete<{ Params: { id: string } }>("/:id", { preHandler: requireAdmin }, controller.delete.bind(controller));
}
