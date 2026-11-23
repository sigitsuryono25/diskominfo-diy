import { FastifyInstance } from "fastify";
import { UserRepository } from "../../database/repositories/user.repository";
import { UserUseCase } from "../../../usecases/user.usecase";
import { AuthController } from "../controllers/auth.controller";
import { requireAdmin } from "../middlewares/auth.middleware";
import { CreateUserRequest, UpdateUserRequest, UserRequest } from "../../../domain/entities/users.entity";

export async function authRoute(fastify: FastifyInstance) {
    const repo = new UserRepository();
    const usecase = new UserUseCase(repo);
    const controller = new AuthController(usecase);

    // Auth Public
    fastify.post<{ Body: UserRequest }>("/login", controller.login.bind(controller));

    // Users CRUD (Protected - Admin only)
    fastify.get("/users", { preHandler: requireAdmin }, controller.getAllUsers.bind(controller));
    fastify.get<{ Params: { id: string } }>("/users/:id", { preHandler: requireAdmin }, controller.getUserById.bind(controller));
    fastify.post<{ Body: CreateUserRequest }>("/users", { preHandler: requireAdmin }, controller.createUser.bind(controller));
    fastify.put<{ Params: { id: string }; Body: UpdateUserRequest }>("/users/:id", { preHandler: requireAdmin }, controller.updateUser.bind(controller));
    fastify.delete<{ Params: { id: string } }>("/users/:id", { preHandler: requireAdmin }, controller.deleteUser.bind(controller));
}
