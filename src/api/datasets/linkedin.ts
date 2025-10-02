import type { DatasetOptions } from '../../types';
import {
    DatasetOptionsSchema,
    DatasetInputSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import { BaseAPI, type BaseAPIOptions } from './base';

const DATASET_ID = {
    PROFILE: 'gd_l1viktl72bvl7bjuj0',
    COMPANY: 'gd_l1vikfnt1wgvvqz95w',
    JOB: 'gd_lpfll7v5hcqtkxl6l',
    POST: 'gd_lyy3tktm25m4avu764',
};

const getCount = (val: string | string[]) =>
    Array.isArray(val) ? val.length : 1;

const assertGetInput = (
    input: string | string[],
    opts: DatasetOptions,
    fn: string,
) => {
    const prefix = `linkedin.${fn}: `;
    return [
        assertSchema(DatasetInputSchema, input, `${prefix}invalid input`),
        assertSchema(DatasetOptionsSchema, opts, `${prefix}invalid options`),
    ] as const;
};

export class LinkedinAPI extends BaseAPI {
    constructor(opts: BaseAPIOptions) {
        super(opts);
        this.name = 'linkedin';
        this.init();
    }

    getProfiles(input: string | string[], opt: DatasetOptions) {
        this.logger.info(
            `fetching linkedin profiles for ${getCount(input)} urls`,
        );
        const [safeInput, safeOpt] = assertGetInput(input, opt, 'getProfiles');
        return this.invoke(safeInput, DATASET_ID.PROFILE, safeOpt);
    }

    getCompanies(input: string | string[], opt: DatasetOptions) {
        this.logger.info(
            `fetching linkedin companies for ${getCount(input)} urls`,
        );
        const [safeInput, safeOpt] = assertGetInput(input, opt, 'getCompanies');
        return this.invoke(safeInput, DATASET_ID.COMPANY, safeOpt);
    }

    getJobs(input: string | string[], opt: DatasetOptions) {
        this.logger.info(`fetching linkedin jobs for ${getCount(input)} urls`);
        const [safeInput, safeOpt] = assertGetInput(input, opt, 'getJobs');
        return this.invoke(safeInput, DATASET_ID.JOB, safeOpt);
    }

    getPosts(input: string | string[], opt: DatasetOptions) {
        this.logger.info(`fetching linkedin posts for ${getCount(input)} urls`);
        const [safeInput, safeOpt] = assertGetInput(input, opt, 'getPosts');
        return this.invoke(safeInput, DATASET_ID.POST, safeOpt);
    }
}
