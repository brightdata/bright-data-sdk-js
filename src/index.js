'use strict'; /*jslint node:true*/

const {bdclient} = require('./client.js');
const {
    BrightDataError,
    ValidationError,
    AuthenticationError,
    ZoneError,
    NetworkError,
    APIError
} = require('./exceptions/errors.js');

const E = module.exports;
const VERSION = '1.1.0';

E.bdclient = bdclient;
E.BrightDataError = BrightDataError;
E.ValidationError = ValidationError;
E.AuthenticationError = AuthenticationError;
E.ZoneError = ZoneError;
E.NetworkError = NetworkError;
E.APIError = APIError;
E.VERSION = VERSION;
E.default = bdclient;