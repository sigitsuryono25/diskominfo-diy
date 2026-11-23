import type { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { ForbiddenException, UnauthorizedException } from '../../../domain/exceptions/app.exceptions.js';

export interface AuthUser {
  id: number;
  role: 'ADMIN' | 'USER';
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null;
  }
}

export async function authenticate(request: FastifyRequest): Promise<void> {
  const authorization = request.headers.authorization;
  const [scheme, token] = authorization?.split(' ') ?? [];
  const secret = process.env.JWT_SECRET;

  if (scheme !== 'Bearer' || !token || !secret) {
    throw new UnauthorizedException('Token autentikasi tidak valid atau tidak tersedia');
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === 'string' || !payload.sub || !['ADMIN', 'USER'].includes(String(payload.role))) {
      throw new Error('Invalid token payload');
    }
    request.user = { id: Number(payload.sub), role: payload.role as AuthUser['role'] };
  } catch {
    throw new UnauthorizedException('Token tidak valid atau sudah kedaluwarsa');
  }
}

export async function requireAdmin(request: FastifyRequest): Promise<void> {
  if (request.user?.role !== 'ADMIN') {
    throw new ForbiddenException('Akses hanya untuk role ADMIN');
  }
}
