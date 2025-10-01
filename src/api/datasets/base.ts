import { API_ENDPOINT } from '../../utils/constants';
import { getLogger } from '../../utils/logger';
import { APIError, BRDError } from '../../utils/errors';
import { request, getDispatcher, assertResponse } from '../../utils/net';
import { getAuthHeaders } from '../../utils/auth';
import { dropEmptyKeys, parseJSON } from '../../utils/misc';
import type {
    DatasetOptionsAsync,
    DatasetOptionsSync,
    DatasetOptions,
} from '../../types';

interface StatusResponse {
    snapshot_id: string;
    dataset_id: string;
    status: 'running' | 'ready' | 'failed';
}

interface WebhookDisabled {
    notify: undefined | false;
}

interface WebhookEnabled {
    notify: true;
    endpoint: string;
    auth_header?: string;
    uncompressed_webhook?: boolean;
}

type WebhookSettings = WebhookEnabled | WebhookDisabled;

interface DatasetsQueryParamsBase {
    dataset_id: string;
    custom_output_fields?: string;
    include_errors?: boolean;
}

type DatasetsQueryParamsAsync = DatasetsQueryParamsBase & {
    format?: DatasetOptionsAsync['format'];
    type?: 'discover_new';
    discover_by?: string;
    limit_per_input?: number;
    limit_multiple_results?: number;
} & WebhookSettings;

interface DatasetsQueryParamsSync extends DatasetsQueryParamsBase {
    format?: DatasetOptionsSync['format'];
}

interface DatasetQueryResponseAsync {
    snapshot_id: string;
}

interface InputRecord {
    url: string;
}

interface DatasetsQueryBodySync {
    input: InputRecord[];
    custom_output_fields?: string;
}

type DatasetsQueryBodyAsync = InputRecord[];

export interface BaseAPIOptions {
    apiKey: string;
}

const str2inputRecord = (str: string): InputRecord => ({ url: str });

const toList = (val: string | string[]): string[] =>
    Array.isArray(val) ? val : [val];

export class BaseAPI {
    protected name!: string;
    protected logger!: ReturnType<typeof getLogger>;
    private authHeaders: ReturnType<typeof getAuthHeaders>;

    constructor(opts: BaseAPIOptions) {
        this.authHeaders = getAuthHeaders(opts.apiKey);
    }

    init() {
        this.logger = getLogger(`api.datasets.${this.name}`);
    }

    async getSnapshotStatus(snapshotId: string) {
        this.logger.info(`fetching snapshot status for id ${snapshotId}`);
        const url = API_ENDPOINT.SNAPSHOT_STATUS.replace(
            '{snapshot_id}',
            snapshotId,
        );

        try {
            const response = await request(url, {
                headers: this.authHeaders,
                dispatcher: getDispatcher(),
            });
            const responseTxt = await assertResponse(response);
            return parseJSON<StatusResponse>(responseTxt);
        } catch (e: unknown) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${(e as Error).message}`);
        }
    }

    private getRequestBody(
        urls: string[],
        opt: DatasetOptions,
    ): DatasetsQueryBodySync | DatasetsQueryBodyAsync {
        if (opt.async) {
            return urls.map(str2inputRecord);
        }

        return {
            input: urls.map(str2inputRecord),
        } as DatasetsQueryBodySync;
    }

    private getRequestQuery(
        datasetId: string,
        opt: DatasetOptions,
    ): DatasetsQueryParamsSync | DatasetsQueryParamsAsync {
        let res: DatasetsQueryParamsAsync | DatasetsQueryParamsSync;

        if (opt.async) {
            res = {
                dataset_id: datasetId,
                custom_output_fields: opt.customOutputFields,
            } as DatasetsQueryParamsAsync;
        } else {
            res = {
                dataset_id: datasetId,
                custom_output_fields: opt.customOutputFields,
            } as DatasetsQueryParamsSync;
        }

        dropEmptyKeys(
            res as Record<
                keyof DatasetsQueryParamsAsync | keyof DatasetsQueryParamsSync,
                unknown
            >,
        );

        return res;
    }

    protected async invoke(
        val: string | string[],
        datasetId: string,
        opt: DatasetOptions,
    ) {
        const body = this.getRequestBody(toList(val), opt);

        const endpoint = opt.async
            ? API_ENDPOINT.SCRAPE_ASYNC
            : API_ENDPOINT.SCRAPE_SYNC;

        try {
            const response = await request(endpoint, {
                method: 'POST',
                query: this.getRequestQuery(datasetId, opt),
                body: JSON.stringify(body),
                headers: this.authHeaders,
                dispatcher: getDispatcher(),
            });

            const responseTxt = await assertResponse(response);

            if (opt.async) {
                return parseJSON<DatasetQueryResponseAsync>(responseTxt);
            } else if (response.statusCode === 202) {
                this.logger.info(
                    'request exeeded sync request timeout, converted to async',
                );
                return parseJSON<DatasetQueryResponseAsync>(responseTxt);
            }

            if (opt.format === 'json') {
                return parseJSON<Record<string, unknown>[]>(responseTxt);
            }

            return responseTxt;
        } catch (e: unknown) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${(e as Error).message}`);
        }
    }
}
