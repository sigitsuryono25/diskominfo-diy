import { CreateUserRequest, IUserRepository, UpdateUserRequest, UserRequest, UserResponse, UsersEntity } from "../domain/entities/users.entity";
import { AppException, BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "../domain/exceptions/app.exceptions";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class UserUseCase {
    constructor(private userRepository: IUserRepository) { }

    async findByEmail(userEntity: UserRequest) {
        if (typeof userEntity.email !== 'string' || typeof userEntity.password !== 'string' || !userEntity.email.trim() || !userEntity.password) {
            throw new BadRequestException("Email dan password wajib diisi");
        }
        const regex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        if (!regex.test(userEntity.email)) throw new BadRequestException("Email is not valid");
        const user = await this.userRepository.findByEmail(userEntity.email);

        if (!user || !(await bcrypt.compare(userEntity.password, user.password_hash))) {
            throw new UnauthorizedException('Email atau password salah');
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new AppException('Konfigurasi autentikasi belum tersedia');
        }

        const token = jwt.sign(
            { sub: String(user.id), role: user.role },
            secret,
            { expiresIn: '24h' },
        );

        return token;
    }

    async getAllUsers(): Promise<UserResponse[]> {
        return this.userRepository.findAll();
    }

    async getUserById(id: number): Promise<UserResponse> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException("Pengguna tidak ditemukan");
        }
        const { password_hash, ...rest } = user;
        return rest;
    }

    async createUser(request: CreateUserRequest): Promise<UserResponse> {
        if (!request.name || !request.email || !request.password || !request.role) {
            throw new BadRequestException("name, email, password, dan role wajib diisi");
        }

        const existing = await this.userRepository.findByEmail(request.email);
        if (existing) {
            throw new ConflictException("Email sudah terdaftar");
        }

        const hash = await bcrypt.hash(request.password, 10);
        return this.userRepository.create({
            name: request.name.trim(),
            email: request.email.trim().toLowerCase(),
            password_hash: hash,
            role: request.role,
        });
    }

    async updateUser(id: number, request: UpdateUserRequest): Promise<UserResponse> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException("Pengguna tidak ditemukan");
        }

        const updateData: Partial<UsersEntity> = {};
        if (request.name) updateData.name = request.name.trim();
        if (request.email) {
            const existing = await this.userRepository.findByEmail(request.email);
            if (existing && existing.id !== id) {
                throw new ConflictException("Email sudah digunakan pengguna lain");
            }
            updateData.email = request.email.trim().toLowerCase();
        }
        if (request.password) {
            updateData.password_hash = await bcrypt.hash(request.password, 10);
        }
        if (request.role) updateData.role = request.role;

        const updated = await this.userRepository.update(id, updateData);
        if (!updated) {
            throw new NotFoundException("Gagal mengupdate pengguna");
        }
        return updated;
    }

    async deleteUser(id: number): Promise<void> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException("Pengguna tidak ditemukan");
        }
        await this.userRepository.delete(id);
    }
}