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
    SnapshotStatusResponse,
} from '../../types';
import { BaseAPI, BaseAPIOptions } from './base';

export class SnapshotAPI extends BaseAPI {
    constructor(opts: BaseAPIOptions) {
        super(opts);
        this.name = 'snapshot';
        this.init();
    }
    /**
     * Get the status of a dataset snapshot.
     * @param snapshotId - The unique identifier of the snapshot
     * @returns A promise that resolves with the snapshot status metadata
     */
    async getStatus(snapshotId: string) {
        const safeId = assertSchema(
            SnapshotIdSchema,
            snapshotId,
            'snapshot.getStatus: invalid snapshot id',
        );
        return this.#getStatus(safeId);
    }
    /**
     * Download the data from a dataset snapshot.
     * @param snapshotId - The unique identifier of the snapshot
     * @param opts - Download options including format and compression settings
     * @returns A promise that resolves with the snapshot data
     */
    async download(snapshotId: string, options: SnapshotDownloadOptions = {}) {
        const safeId = assertSchema(
            SnapshotIdSchema,
            snapshotId,
            'snapshot.download: invalid snapshot id',
        );
        const safeOpts = assertSchema(
            SnapshotDownloadOptionsSchema,
            options,
            'snapshot.download: invalid options',
        );
        return this.#download(safeId, safeOpts);
    }
    /**
     * Cancel the dataset gathering process.
     * @param snapshotId - The unique identifier of the snapshot
     * @returns A promise that resolves once the snapshot is cancelled
     */
    async cancel(snapshotId: string): Promise<void> {
        const safeId = assertSchema(
            SnapshotIdSchema,
            snapshotId,
            'snapshot.cancel: invalid snapshot id',
        );
        return this.#cancel(safeId);
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
            return parseJSON<SnapshotStatusResponse>(responseTxt);
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

    async #cancel(snapshotId: string) {
        this.logger.info(`fetching snapshot for id ${snapshotId}`);
        const url = API_ENDPOINT.SNAPSHOT_CANCEL.replace(
            '{snapshot_id}',
            snapshotId,
        );

        try {
            const response = await request(url, {
                method: 'POST',
                headers: this.authHeaders,
                dispatcher: getDispatcher(),
            });

            await assertResponse(response);
        } catch (e: unknown) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${(e as Error).message}`);
        }
    }
}
