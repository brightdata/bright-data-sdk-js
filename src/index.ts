import { bdclient } from './client';
import {
    BRDError,
    ValidationError,
    AuthenticationError,
    ZoneError,
    NetworkError,
    APIError,
} from './utils/errors';
import { PACKAGE_VERSION } from './utils/constants';

const VERSION = PACKAGE_VERSION;

export {
    bdclient,
    BRDError,
    ValidationError,
    AuthenticationError,
    ZoneError,
    NetworkError,
    APIError,
    VERSION,
};
