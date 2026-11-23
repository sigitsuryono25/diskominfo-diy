import { FastifyReply, FastifyRequest } from "fastify";
import { RoomsUsecase } from "../../../usecases/rooms.usecase";
import { RoomsEntity } from "../../../domain/entities/rooms.entity";

export class RoomsController {
    constructor(private roomUseCase: RoomsUsecase) { }

    async create(request: FastifyRequest<{ Body: RoomsEntity }>, reply: FastifyReply) {
        const data = await this.roomUseCase.create(request.body);
        return reply.status(201).send(data);
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const data = await this.roomUseCase.getAllRooms();
        return reply.status(200).send({ data });
    }

    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const data = await this.roomUseCase.getRoomById(Number(request.params.id));
        return reply.status(200).send(data);
    }

    async update(request: FastifyRequest<{ Params: { id: string }; Body: Partial<RoomsEntity> }>, reply: FastifyReply) {
        const data = await this.roomUseCase.updateRoom(Number(request.params.id), request.body);
        return reply.status(200).send(data);
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        await this.roomUseCase.deleteRoom(Number(request.params.id));
        return reply.status(200).send({ message: "Ruangan berhasil dihapus" });
    }

    async getAvailable(request: FastifyRequest<{ Querystring: { start: string; end: string } }>, reply: FastifyReply) {
        const { start, end } = request.query;
        const data = await this.roomUseCase.getAvailableRooms(start, end);
        return reply.status(200).send({ data });
    }
}
