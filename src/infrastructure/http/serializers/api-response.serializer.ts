import { FastifyReply } from "fastify";

export interface ApiResponse<T = any> {
    statusCode: number;
    message: string;
    data: T;
}

export class ResponseFormatter {
    static ok<T>(reply: FastifyReply, data: T, message: string = "Success") {
        const payload: ApiResponse<T> = {
            statusCode: 200,
            message,
            data
        }

        return reply.status(200).send(payload);
    }


    static created<T>(reply: FastifyReply, data: T, message: string = "Resource created successfully") {
        const payload: ApiResponse<T> = {
            statusCode: 201,
            message,
            data
        }

        return reply.status(201).send(payload);
    }

    static noContent(reply: FastifyReply) {
        return reply.status(204).send();
    }
}