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
    status_code: number | null;
    response_text: string | null;

    constructor(message: string, status_code = null, response_text = null) {
        super(message);
        this.name = 'APIError';
        this.status_code = status_code;
        this.response_text = response_text;
    }
}
