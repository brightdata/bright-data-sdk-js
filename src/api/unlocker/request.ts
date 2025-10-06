import { PromisePool } from '@supercharge/promise-pool';
import { API_ENDPOINT, DEFAULT_CONCURRENCY } from '../../utils/constants';
import { getLogger } from '../../utils/logger';
import { APIError, BRDError } from '../../utils/errors';
import { request, getDispatcher, assertResponse } from '../../utils/net';
import { getAuthHeaders } from '../../utils/auth';
import { dropEmptyKeys, parseJSON } from '../../utils/misc';
import { ZoneNameSchema } from '../../schemas/shared';
import type { ZoneType } from '../../types/zones';
import type {
    RequestOptions,
    SingleRawResponse,
    BatchRawResponse,
    RequestJSONOptions,
    SingleJSONResponse,
    BatchJSONResponse,
    SingleResponse,
    BatchResponse,
} from '../../types/request';
import type { ZonesAPI } from '../zones';

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
    autoCreateZones: boolean;
    zone?: string;
}

export class RequestAPI {
    protected name!: string;
    protected zoneType!: ZoneType;
    private logger!: ReturnType<typeof getLogger>;
    private authHeaders: ReturnType<typeof getAuthHeaders>;
    private zone?: string;
    private zonesAPI: ZonesAPI;
    private autoCreateZones: boolean;

    constructor(opts: RequestAPIOptions) {
        if (opts.zone) this.zone = opts.zone;
        this.authHeaders = getAuthHeaders(opts.apiKey);
        this.zonesAPI = opts.zonesAPI;
        this.autoCreateZones = opts.autoCreateZones;
    }

    init() {
        this.logger = getLogger(`api.request.${this.name}`);
    }
    // prettier-ignore
    async handle(val: string, opts?: RequestJSONOptions): Promise<SingleJSONResponse>;
    // prettier-ignore
    async handle(val: string, opts?: RequestOptions): Promise<SingleRawResponse>;
    // prettier-ignore
    async handle(val: string[], opts?: RequestJSONOptions): Promise<BatchJSONResponse>;
    // prettier-ignore
    async handle(val: string[], opts?: RequestOptions): Promise<BatchRawResponse>;
    async handle(
        val: string | string[],
        opts: RequestOptions | RequestJSONOptions = {},
    ): Promise<SingleResponse | BatchResponse> {
        const zone = ZoneNameSchema.parse(opts.zone || this.zone);

        if (this.autoCreateZones) {
            await this.zonesAPI.ensureZone(zone, { type: this.zoneType });
        }

        if (Array.isArray(val)) {
            this.logger.info(
                `starting batch operation for ${val.length} items`,
            );
            return this.handleBatch(val, zone, opts);
        }

        this.logger.info(`starting operation for ${val}`);
        return this.handleSingle(val, zone, opts);
    }

    protected getURL(_content: string, _opt: RequestOptions): string {
        throw new Error('method not implemented.');
    }

    protected getMethod(_opt: RequestOptions): RequestOptions['method'] {
        throw new Error('method not implemented.');
    }

    private getRequestBody(content: string, zone: string, opt: RequestOptions) {
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

        dropEmptyKeys(res as Record<keyof RequestQueryBody, unknown>);

        return res;
    }
    // prettier-ignore
    private async handleSingle(val: string, zone: string, opt: RequestJSONOptions): Promise<SingleJSONResponse>;
    // prettier-ignore
    private async handleSingle(val: string, zone: string, opt: RequestOptions): Promise<SingleRawResponse>;
    private async handleSingle(
        val: string,
        zone: string,
        opt: RequestOptions | RequestJSONOptions = {},
    ): Promise<SingleResponse> {
        const body = this.getRequestBody(val, zone, opt);

        try {
            const response = await request(API_ENDPOINT.REQUEST, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.authHeaders,
                dispatcher: getDispatcher({ timeout: opt.timeout }),
            });

            const responseTxt = await assertResponse(response);
            if (opt.format === 'json') {
                return parseJSON<SingleJSONResponse>(responseTxt);
            }
            return responseTxt;
        } catch (e: unknown) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${(e as Error).message}`);
        }
    }
    // prettier-ignore
    private async handleBatch(inputs: string[], zone: string, opt: RequestJSONOptions): Promise<BatchJSONResponse>;
    // prettier-ignore
    private async handleBatch(inputs: string[], zone: string, opt: RequestOptions): Promise<BatchRawResponse>;
    private async handleBatch(
        inputs: string[],
        zone: string,
        opt: RequestOptions | RequestJSONOptions = {},
    ): Promise<BatchResponse> {
        const limit = opt.concurrency || DEFAULT_CONCURRENCY;

        this.logger.info(
            `processing ${inputs.length} items, concurrency is ${limit}`,
        );

        try {
            const { results } = await PromisePool.for(inputs)
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
