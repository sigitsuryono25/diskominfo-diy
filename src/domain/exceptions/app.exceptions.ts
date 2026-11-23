export class AppException extends Error {
    constructor(public message: string, public statusCode: number = 500, public errorCode?: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}


export class BadRequestException extends AppException {
    constructor(message: string = "Bad Request", errorCode: string = "BAD_REQUEST") {
        super(message, 400, errorCode);
    }
}

export class ConflictException extends AppException {
    constructor(message: string = "Conflict", errorCode: string = "ROOM_CONFLICT") {
        super(message, 409, errorCode);
    }
}

export class UnauthorizedException extends AppException {
    constructor(message: string = "Unauthorized", errorCode: string = "UNAUTHORIZED") {
        super(message, 401, errorCode);
    }
}

export class ForbiddenException extends AppException {
    constructor(message: string = "Forbidden", errorCode: string = "FORBIDDEN") {
        super(message, 403, errorCode);
    }
}

export class NotFoundException extends AppException {
    constructor(message: string = "Not Found", errorCode: string = "NOT_FOUND") {
        super(message, 404, errorCode);
    }
}
