import { FastifyInstance } from "fastify";
import { UserRepository } from "../../database/repositories/user.repository";
import { UserUseCase } from "../../../usecases/user.usecase";
import { AuthController } from "../controllers/auth.controller";

export async function authRoute(fastify: FastifyInstance) {
    const repo = new UserRepository();
    const usecase = new UserUseCase(repo);
    const controller = new AuthController(usecase);

    fastify.post("/login", controller.findByEmail.bind(controller));
}
