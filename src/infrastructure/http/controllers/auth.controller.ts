import type { FastifyReply, FastifyRequest } from 'fastify';
import { UserRequest } from '../../../domain/entities/users.entity.js';
import { UserUseCase } from '../../../usecases/user.usecase.js';
import { ResponseFormatter } from '../serializers/api-response.serializer.js';

export class AuthController {
  constructor(private userRepository: UserUseCase) { }


  async findByEmail(request: FastifyRequest<{ Body: UserRequest }>, reply: FastifyReply) {
    const token = await this.userRepository.findByEmail(request.body);
    return reply.status(200).send({ token });
  }
}