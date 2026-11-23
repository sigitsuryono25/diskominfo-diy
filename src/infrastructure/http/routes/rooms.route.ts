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

    fastify.get<{ Querystring: { start: string; end: string } }>("/available", controller.getAvailable.bind(controller));
    fastify.post<{ Body: RoomsEntity }>("/", { preHandler: requireAdmin }, controller.create.bind(controller));
}
