import { FastifyInstance } from "fastify";
import { authRoute } from "./auth.routes";
import { roomsRoute } from "./rooms.route";
import { bookingsRoute } from "./bookings.route";

export async function appRoutes(fastify: FastifyInstance) {
    fastify.register(authRoute, { prefix: '/auth' });
    fastify.register(roomsRoute, { prefix: '/rooms' });
    fastify.register(bookingsRoute, { prefix: '/bookings' });
}
