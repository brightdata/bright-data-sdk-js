import { PromisePool } from '@supercharge/promise-pool';
import { API_ENDPOINT, DEFAULT_CONCURRENCY } from '../utils/constants';
import { getLogger, logRequest } from '../utils/logger';
import { APIError, BRDError } from '../utils/errors';
import { request, getDispatcher, assertResponse } from '../utils/net';
import { getAuthHeaders } from '../utils/auth';
import { dropEmptyKeys, parseJSON } from '../utils/misc';
import { ZoneNameSchema } from '../schemas';
import type {
    RequestOptions,
    JSONResponse,
    SingleResponse,
    BatchResponse,
    ZoneType,
} from '../types';
import type { ZonesAPI } from './zones';

interface RequestQueryBody {
    url: string;
    zone: RequestOptions['zone'];
    format: RequestOptions['format'];
    method?: RequestOptions['method'];
    country?: RequestOptions['country'];
    data_format?: Exclude<RequestOptions['dataFormat'], 'html'>;
}

export interface RequestAPIOptions {
    apiKey: string;
    zonesAPI: ZonesAPI;
    autoCreateZones?: boolean;
    zone?: string;
}

export class RequestAPI {
    protected name: string;
    protected zoneType: ZoneType;
    private authHeaders: ReturnType<typeof getAuthHeaders>;
    private logger: ReturnType<typeof getLogger>;
    private zone?: string;
    private zonesAPI: ZonesAPI;
    private autoCreateZones: boolean;

    constructor(opts: RequestAPIOptions) {
        this.zone = opts.zone;
        this.authHeaders = getAuthHeaders(opts.apiKey);
        this.zonesAPI = opts.zonesAPI;
        this.autoCreateZones = opts.autoCreateZones;
    }

    init() {
        this.logger = getLogger(`api.${this.name}`);
    }

    async handle(val: string, opts?: RequestOptions): Promise<SingleResponse>;
    async handle(val: string[], opts?: RequestOptions): Promise<BatchResponse>;
    async handle(input: string | string[], opt: RequestOptions = {}) {
        const zone = ZoneNameSchema.parse(opt.zone || this.zone);

        if (this.autoCreateZones) {
            await this.zonesAPI.ensureZone(zone, { type: this.zoneType });
        }

        if (Array.isArray(input)) {
            this.logger.info(
                `starting batch operation for ${input.length} items`,
            );
            return this.handleBatch(input, zone, opt);
        }

        this.logger.info(`starting operation for ${input}`);

        return this.handleSingle(input, zone, opt);
    }

    protected getURL(content: string, opt: RequestOptions): string {
        throw new Error('Method not implemented.');
    }

    protected getMethod(opt: RequestOptions): RequestOptions['method'] {
        throw new Error('Method not implemented.');
    }

    protected getRequestBody(
        content: string,
        zone: string,
        opt: RequestOptions,
    ): RequestQueryBody {
        const res: RequestQueryBody = {
            method: this.getMethod(opt),
            url: this.getURL(content, opt),
            zone: zone,
            country: opt.country,
            format: opt.format || 'raw',
        };

        if (opt.dataFormat && opt.dataFormat !== 'html') {
            res.data_format = opt.dataFormat;
        }

        dropEmptyKeys(res);

        return res;
    }

    private async handleSingle(
        url: string,
        zone: string,
        opt: RequestOptions = {},
    ): Promise<SingleResponse> {
        const body = this.getRequestBody(url, zone, opt);

        logRequest('POST', API_ENDPOINT.REQUEST, body);

        try {
            const response = await request(API_ENDPOINT.REQUEST, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.authHeaders,
                dispatcher: getDispatcher({ timeout: opt.timeout }),
            });

            const responseTxt = await assertResponse(response);
            if (opt.format === 'json') {
                return parseJSON<JSONResponse>(responseTxt);
            }
            return responseTxt;
        } catch (e: any) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${e.message}`);
        }
    }

    private async handleBatch(
        urls: string[],
        zone: string,
        opt: RequestOptions = {},
    ): Promise<BatchResponse> {
        const limit = opt.concurrency || DEFAULT_CONCURRENCY;
        this.logger.info(
            `processing ${urls.length} items, concurrency is ${limit}`,
        );

        try {
            const { results } = await PromisePool.for(urls)
                .withConcurrency(limit)
                .useCorrespondingResults()
                .process(async (url) => {
                    try {
                        return await this.handleSingle(url, zone, opt);
                    } catch (e: unknown) {
                        return e as BRDError;
                    }
                });

            const res = results.map((v) => {
                if (v === PromisePool.failed || v === PromisePool.notRun)
                    return new BRDError('unknown error occurred');
                return v as Exclude<typeof v, symbol>;
            });

            this.logger.info(
                `completed batch operation: ${res.length} results`,
            );

            return res;
        } catch (error: unknown) {
            const err = error as Error;
            const msg = `batch operation failed: ${err.message}`;
            this.logger.error(msg);
            throw new APIError(msg);
        }
    }
}
