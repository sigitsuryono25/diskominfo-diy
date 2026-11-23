export class AppException extends Error {
    constructor(public message: string, public statusCode: number = 500, public errorCode?: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


export class BadRequestException extends AppException {
    constructor(message: string = "Bad Request", errorCode?: string) {
        super(message, 400, errorCode);
    }
}

export class ConflictException extends AppException {
    constructor(message: string = "Conflict", errorCode?: string) {
        super(message, 409, errorCode);
    }
}

export class UnauthorizedException extends AppException {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
    }
}

export class ForbiddenException extends AppException {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

export class NotFoundException extends AppException {
    constructor(message: string = "Not Found") {
        super(message, 404);
    }
}
