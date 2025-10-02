import { API_ENDPOINT } from '../../utils/constants';
import { APIError, BRDError } from '../../utils/errors';
import { request, getDispatcher, assertResponse } from '../../utils/net';
import { parseJSON } from '../../utils/misc';
import {
    SnapshotIdSchema,
    SnapshotDownloadOptionsSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import type {
    SnapshotDownloadOptions,
    SnapshotStatus,
    SnapshotStatusMeta,
} from '../../types';
import { BaseAPI, BaseAPIOptions } from './base';

interface StatusRawResponse {
    snapshot_id: string;
    dataset_id: string;
    status: SnapshotStatus;
}

export class SnapshotAPI extends BaseAPI {
    constructor(opts: BaseAPIOptions) {
        super(opts);
        this.name = 'snapshot';
        this.init();
    }

    async getStatus(snapshotId: string) {
        const safeId = assertSchema(SnapshotIdSchema, snapshotId);
        return this.#getStatus(safeId);
    }

    async download(snapshotId: string, opts: SnapshotDownloadOptions = {}) {
        const safeId = assertSchema(SnapshotIdSchema, snapshotId);
        const safeOpts = assertSchema(SnapshotDownloadOptionsSchema, opts);
        return this.#download(safeId, safeOpts);
    }

    async #getStatus(snapshotId: string) {
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
            const raw = parseJSON<StatusRawResponse>(responseTxt);

            return {
                snapshotId: raw.snapshot_id,
                datasetId: raw.dataset_id,
                status: raw.status,
            } as SnapshotStatusMeta;
        } catch (e: unknown) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${(e as Error).message}`);
        }
    }

    async #download(snapshotId: string, opts: SnapshotDownloadOptions = {}) {
        this.logger.info(`fetching snapshot for id ${snapshotId}`);
        const url = API_ENDPOINT.SNAPSHOT_DOWNLOAD.replace(
            '{snapshot_id}',
            snapshotId,
        );

        try {
            const response = await request(url, {
                headers: this.authHeaders,
                query: opts,
                dispatcher: getDispatcher(),
            });

            return await assertResponse(response, false);
        } catch (e: unknown) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${(e as Error).message}`);
        }
    }
}
