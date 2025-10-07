import { type Dispatcher } from 'undici';
import { API_ENDPOINT } from '../../utils/constants';
import { APIError, BRDError } from '../../utils/errors';
import { request, getDispatcher, assertResponse } from '../../utils/net';
import { parseJSON, getRandomInt, sleep } from '../../utils/misc';
import {
    SnapshotIdSchema,
    SnapshotDownloadEndpointOptionsSchema,
    SnapshotDownloadOptionsSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import type {
    SnapshotDownloadOptions,
    SnapshotDownloadEndpointOptions,
    SnapshotStatusResponse,
} from '../../types/datasets';
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
    async download(
        snapshotId: string,
        downloadOptions?: SnapshotDownloadEndpointOptions,
        options?: SnapshotDownloadOptions,
    ) {
        const safeId = assertSchema(
            SnapshotIdSchema,
            snapshotId,
            'snapshot.download: invalid snapshot id',
        );
        const safeEOpts = assertSchema(
            SnapshotDownloadEndpointOptionsSchema,
            downloadOptions || {},
            'snapshot.download: invalid options',
        );
        const safeOpts = assertSchema(
            SnapshotDownloadOptionsSchema,
            options || {},
            'snapshot.download: invalid options',
        );
        return this.#download(safeId, safeEOpts, safeOpts);
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

    async #download(
        snapshotId: string,
        endpointOpts: SnapshotDownloadEndpointOptions,
        options: SnapshotDownloadOptions,
    ): Promise<Dispatcher.ResponseData['body']> {
        this.logger.info(`fetching snapshot for id ${snapshotId}`);
        const url = API_ENDPOINT.SNAPSHOT_DOWNLOAD.replace(
            '{snapshot_id}',
            snapshotId,
        );

        try {
            const response = await request(url, {
                headers: this.authHeaders,
                query: endpointOpts,
                dispatcher: getDispatcher(),
            });

            if (response.statusCode === 202) {
                if (!options.statusPolling) {
                    throw new BRDError(
                        'snapshot is not ready yet, please try again later',
                    );
                }

                await this.#awaitReady(snapshotId);
                return this.#download(snapshotId, endpointOpts, options);
            }

            return await assertResponse(response, false);
        } catch (e: unknown) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`operation failed: ${(e as Error).message}`);
        }
    }

    async #awaitReady(snapshotId: string): Promise<void> {
        this.logger.info(`polling snapshot status for id ${snapshotId}`);

        for (;;) {
            const { status } = await this.#getStatus(snapshotId);

            if (status === 'ready') break;
            if (status === 'failed') {
                throw new BRDError('snapshot generation failed');
            }

            const delayMs = getRandomInt(10_000, 30_000);
            this.logger.info(
                `snapshot ${snapshotId} is not ready yet, waiting for ${delayMs}ms`,
            );

            await sleep(delayMs);
        }
    }

    async #cancel(snapshotId: string) {
        this.logger.info(`cancelling snapshot for id ${snapshotId}`);
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
