import type { FastifyReply, FastifyRequest } from 'fastify';
import { CreateUserRequest, UpdateUserRequest, UserRequest } from '../../../domain/entities/users.entity.js';
import { UserUseCase } from '../../../usecases/user.usecase.js';

export class AuthController {
  constructor(private userUsecase: UserUseCase) { }

  async login(request: FastifyRequest<{ Body: UserRequest }>, reply: FastifyReply) {
    const token = await this.userUsecase.findByEmail(request.body);
    return reply.status(200).send({ token });
  }

  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    const users = await this.userUsecase.getAllUsers();
    return reply.status(200).send({ data: users });
  }

  async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = await this.userUsecase.getUserById(Number(request.params.id));
    return reply.status(200).send(user);
  }

  async createUser(request: FastifyRequest<{ Body: CreateUserRequest }>, reply: FastifyReply) {
    const user = await this.userUsecase.createUser(request.body);
    return reply.status(201).send(user);
  }

  async updateUser(request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserRequest }>, reply: FastifyReply) {
    const user = await this.userUsecase.updateUser(Number(request.params.id), request.body);
    return reply.status(200).send(user);
  }

  async deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.userUsecase.deleteUser(Number(request.params.id));
    return reply.status(200).send({ message: 'Pengguna berhasil dihapus' });
  }
}