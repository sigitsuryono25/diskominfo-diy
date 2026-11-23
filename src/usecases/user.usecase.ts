import { IUserRepository, UserRequest, UsersEntity } from "../domain/entities/users.entity";
import { AppException, BadRequestException } from "../domain/exceptions/app.exceptions";
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
            throw new BadRequestException('Email atau password salah');
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new AppException('Konfigurasi autentikasi belum tersedia');
        }

        const token = jwt.sign(
            { sub: String(user.id), role: user.role },
            secret,
            { expiresIn: '1h' },
        );

        return token;
    }
}