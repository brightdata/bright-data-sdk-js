export class BRDError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BRDError';
    }
}

export class ValidationError extends BRDError {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends BRDError {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class ZoneError extends BRDError {
    constructor(message: string) {
        super(message);
        this.name = 'ZoneError';
    }
}

export class NetworkError extends BRDError {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class FSError extends BRDError {
    constructor(message: string) {
        super(message);
        this.name = 'FSError';
    }
}

export class APIError extends BRDError {
    statusCode: number | null;
    responseText: string | null;

    constructor(
        message: string,
        statusCode: number | null = null,
        responseText: string | null = null,
    ) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.responseText = responseText;
    }
}
