'use strict'; /*jslint node:true*/

const E = module.exports;

class BrightDataError extends Error {
    constructor(message){
        super(message);
        this.name = 'BrightDataError';
    }
}

class ValidationError extends BrightDataError {
    constructor(message){
        super(message);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends BrightDataError {
    constructor(message){
        super(message);
        this.name = 'AuthenticationError';
    }
}

class ZoneError extends BrightDataError {
    constructor(message){
        super(message);
        this.name = 'ZoneError';
    }
}

class NetworkError extends BrightDataError {
    constructor(message){
        super(message);
        this.name = 'NetworkError';
    }
}

class APIError extends BrightDataError {
    constructor(message, status_code = null, response_text = null){
        super(message);
        this.name = 'APIError';
        this.status_code = status_code;
        this.response_text = response_text;
    }
}

E.BrightDataError = BrightDataError;
E.ValidationError = ValidationError;
E.AuthenticationError = AuthenticationError;
E.ZoneError = ZoneError;
E.NetworkError = NetworkError;
E.APIError = APIError;