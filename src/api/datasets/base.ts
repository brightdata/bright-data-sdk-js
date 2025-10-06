import { API_ENDPOINT } from '../../utils/constants';
import { getLogger } from '../../utils/logger';
import { APIError, BRDError } from '../../utils/errors';
import { request, getDispatcher, assertResponse } from '../../utils/net';
import { getAuthHeaders } from '../../utils/auth';
import { dropEmptyKeys, parseJSON } from '../../utils/misc';
import type {
    DatasetOptions,
    UnknownRecord,
    SnapshotFormat,
    SnapshotMeta,
} from '../../types/datasets';

interface WebhookDisabled {
    notify: undefined;
}

interface WebhookEnabled {
    notify: string;
    endpoint: string;
    auth_header?: string;
    uncompressed_webhook?: boolean;
}

type WebhookSettings = WebhookEnabled | WebhookDisabled;

interface DatasetsQueryParamsSync {
    dataset_id: string;
    custom_output_fields?: string;
    include_errors?: boolean;
    format?: SnapshotFormat;
}

type DatasetsQueryParamsAsync = DatasetsQueryParamsSync & {
    type?: 'discover_new';
    discover_by?: string;
    limit_per_input?: number;
    limit_multiple_results?: number;
} & WebhookSettings;

interface DatasetsQueryBodySync {
    input: UnknownRecord[];
    custom_output_fields?: string;
}

type DatasetsQueryBodyAsync = UnknownRecord[];

export interface BaseAPIOptions {
    apiKey: string;
}

export class BaseAPI {
    protected name!: string;
    protected logger!: ReturnType<typeof getLogger>;
    protected authHeaders: ReturnType<typeof getAuthHeaders>;

    constructor(opts: BaseAPIOptions) {
        this.authHeaders = getAuthHeaders(opts.apiKey);
    }

    init() {
        this.logger = getLogger(`api.datasets.${this.name}`);
    }

    #getRequestBody(
        input: UnknownRecord[],
        opt: DatasetOptions,
    ): DatasetsQueryBodySync | DatasetsQueryBodyAsync {
        return opt.async ? input : { input };
    }

    #getRequestQuery(
        datasetId: string,
        opt: DatasetOptions,
    ): DatasetsQueryParamsSync | DatasetsQueryParamsAsync {
        let res: DatasetsQueryParamsAsync | DatasetsQueryParamsSync;

        if (opt.async) {
            res = {
                dataset_id: datasetId,
                custom_output_fields: opt.customOutputFields,
                include_errors: opt.includeErrors,
                format: opt.format,
                discover_by: opt.discoverBy,
                type: opt.type,
                limit_per_input: opt.limitPerInput,
                limit_multiple_results: opt.limitMultipleResults,
                notify: opt.notify,
                endpoint: opt.endpoint,
                auth_header: opt.authHeader,
                uncompressed_webhook: opt.uncompressedWebhook,
            };
        } else {
            res = {
                dataset_id: datasetId,
                custom_output_fields: opt.customOutputFields,
                include_errors: opt.includeErrors,
                format: opt.format,
            };
        }

        dropEmptyKeys(res as Record<keyof DatasetsQueryParamsSync, unknown>);

        return res;
    }

    protected async run(
        val: UnknownRecord[],
        datasetId: string,
        opt: DatasetOptions,
    ) {
        const body = this.#getRequestBody(val, opt);

        const endpoint = opt.async
            ? API_ENDPOINT.SCRAPE_ASYNC
            : API_ENDPOINT.SCRAPE_SYNC;

        try {
            const response = await request(endpoint, {
                method: 'POST',
                query: this.#getRequestQuery(datasetId, opt),
                body: JSON.stringify(body),
                headers: this.authHeaders,
                dispatcher: getDispatcher(),
            });

            const responseTxt = await assertResponse(response);

            if (opt.async) {
                return parseJSON<SnapshotMeta>(responseTxt);
            } else if (response.statusCode === 202) {
                this.logger.info(
                    'request exeeded sync request timeout, converted to async',
                );
                return parseJSON<SnapshotMeta>(responseTxt);
            }

            if (opt.format === 'json') {
                return parseJSON<UnknownRecord[]>(responseTxt);
            }

            return responseTxt;
        } catch (e: unknown) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${(e as Error).message}`);
        }
    }
}
