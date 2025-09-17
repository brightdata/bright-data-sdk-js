import { bdclient } from './client';
import {
    BrightDataError,
    ValidationError,
    AuthenticationError,
    ZoneError,
    NetworkError,
    APIError,
} from './exceptions/errors';

const VERSION = '1.1.0'; // TODO: This should match the version in package.json

export default bdclient;
export {
    bdclient,
    BrightDataError,
    ValidationError,
    AuthenticationError,
    ZoneError,
    NetworkError,
    APIError,
    VERSION,
};
