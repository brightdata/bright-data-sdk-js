import { API_ENDPOINT } from '../../utils/constants';
import { APIError, BRDError } from '../../utils/errors';
import {
    request,
    stream,
    getDispatcher,
    assertResponse,
    throwInvalidStatus,
} from '../../utils/net';
import {
    routeDownloadStream,
    getFilename,
    getAbsAndEnsureDir,
} from '../../utils/files';
import { parseJSON, getRandomInt, sleep } from '../../utils/misc';
import {
    SnapshotIdSchema,
    SnapshotDownloadOptionsSchema,
    SnapshotDownloadOptionsSchemaType,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import type {
    SnapshotDownloadOptions,
    SnapshotStatusResponse,
} from '../../types/datasets';
import { BaseAPI, BaseAPIOptions } from './base';

const assertDownloadStatus = (status: number) => {
    if (status < 202) return;

    if (status === 202) {
        throw new BRDError('snapshot is not ready yet, please try again later');
    }

    throwInvalidStatus(status, 'snapshot download failed');
};

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
     * @returns A promise that resolves with the full filename where the data is saved
     */
    async download(snapshotId: string, options?: SnapshotDownloadOptions) {
        const safeId = assertSchema(
            SnapshotIdSchema,
            snapshotId,
            'snapshot.download: invalid snapshot id',
        );
        const safeOpts = assertSchema(
            SnapshotDownloadOptionsSchema,
            options || {},
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

    async #download(
        snapshotId: string,
        options: SnapshotDownloadOptionsSchemaType,
    ): Promise<string> {
        this.logger.info(`fetching snapshot for id ${snapshotId}`);

        const url = API_ENDPOINT.SNAPSHOT_DOWNLOAD.replace(
            '{snapshot_id}',
            snapshotId,
        );

        try {
            if (options.statusPolling) {
                await this.#awaitReady(snapshotId);
            }

            const filename = getFilename(options.filename, options.format);
            const target = await getAbsAndEnsureDir(filename);

            this.logger.info(
                `starting streaming snapshot ${snapshotId} data to ${target}`,
            );

            await stream(
                url,
                {
                    method: 'GET',
                    headers: this.authHeaders,
                    query: {
                        format: options.format,
                        compress: options.compress,
                    },
                    opaque: {
                        filename: target,
                        assertStatus: assertDownloadStatus,
                    },
                },
                routeDownloadStream,
            );

            return target;
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
