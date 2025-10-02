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
    /**
     * Fetch LinkedIn profile data for one or more profile URLs.
     * @param input - A single LinkedIn profile URL or an array of profile URLs
     * @param opt - Dataset options to control the request behavior
     * @returns A promise that resolves with the profile data
     */
    getProfiles(input: string | string[], opt: DatasetOptions) {
        this.logger.info(
            `fetching linkedin profiles for ${getCount(input)} urls`,
        );
        const [safeInput, safeOpt] = assertGetInput(input, opt, 'getProfiles');
        return this.invoke(safeInput, DATASET_ID.PROFILE, safeOpt);
    }
    /**
     * Fetch LinkedIn company data for one or more company URLs.
     * @param input - A single LinkedIn company URL or an array of company URLs
     * @param opt - Dataset options to control the request behavior
     * @returns A promise that resolves with the company data
     */
    getCompanies(input: string | string[], opt: DatasetOptions) {
        this.logger.info(
            `fetching linkedin companies for ${getCount(input)} urls`,
        );
        const [safeInput, safeOpt] = assertGetInput(input, opt, 'getCompanies');
        return this.invoke(safeInput, DATASET_ID.COMPANY, safeOpt);
    }
    /**
     * Fetch LinkedIn job posting data for one or more job URLs.
     * @param input - A single LinkedIn job URL or an array of job URLs
     * @param opt - Dataset options to control the request behavior
     * @returns A promise that resolves with the job data
     */
    getJobs(input: string | string[], opt: DatasetOptions) {
        this.logger.info(`fetching linkedin jobs for ${getCount(input)} urls`);
        const [safeInput, safeOpt] = assertGetInput(input, opt, 'getJobs');
        return this.invoke(safeInput, DATASET_ID.JOB, safeOpt);
    }
    /**
     * Fetch LinkedIn post data for one or more post URLs.
     * @param input - A single LinkedIn post URL or an array of post URLs
     * @param opt - Dataset options to control the request behavior
     * @returns A promise that resolves with the post data
     */
    getPosts(input: string | string[], opt: DatasetOptions) {
        this.logger.info(`fetching linkedin posts for ${getCount(input)} urls`);
        const [safeInput, safeOpt] = assertGetInput(input, opt, 'getPosts');
        return this.invoke(safeInput, DATASET_ID.POST, safeOpt);
    }
}
