export class BrightDataError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BrightDataError';
    }
}

export class ValidationError extends BrightDataError {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends BrightDataError {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class ZoneError extends BrightDataError {
    constructor(message: string) {
        super(message);
        this.name = 'ZoneError';
    }
}

export class NetworkError extends BrightDataError {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class APIError extends BrightDataError {
    statusCode: number | null;
    responseText: string | null;

    constructor(message: string, statusCode = null, responseText = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.responseText = responseText;
    }
}
