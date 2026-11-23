import { FastifyReply, FastifyRequest } from "fastify";
import { RoomsUsecase } from "../../../usecases/rooms.usecase";
import { RoomsEntity } from "../../../domain/entities/rooms.entity";
import { ResponseFormatter } from "../serializers/api-response.serializer";

export class RoomsController {
    constructor(private roomUseCase: RoomsUsecase) { }


    async create(request: FastifyRequest<{ Body: RoomsEntity }>, reply: FastifyReply) {
        const data = await this.roomUseCase.create(request.body);
        return reply.status(201).send(data);
    }

    async getAvailable(request: FastifyRequest<{ Querystring: { start: string; end: string } }>, reply: FastifyReply) {
        const { start, end } = request.query;
        const data = await this.roomUseCase.getAvailableRooms(start, end);
        return reply.status(200).send({ data });
    }
}
