import type {
    DatasetOptions,
    UnknownRecord,
    UrlFilter,
    LinkedinJobFilter,
    LinkedinProfileFilter,
} from '../../types/datasets';
import {
    DatasetOptionsSchema,
    DatasetMixedInputSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import { BaseAPI, type BaseAPIOptions } from './base';

const DATASET_ID = {
    PROFILE: 'gd_l1viktl72bvl7bjuj0',
    COMPANY: 'gd_l1vikfnt1wgvvqz95w',
    JOB: 'gd_lpfll7v5hcqtkxl6l',
    POST: 'gd_lyy3tktm25m4avu764',
};

type CollectOptions = DatasetOptions;
type DiscoverOptions = Omit<DatasetOptions, 'async' | 'discoverBy' | 'type'>;

const assertInput = (
    input: UnknownRecord[] | string[],
    opts: DatasetOptions = {},
    fn: string,
) => {
    const prefix = `linkedin.${fn}: `;
    return [
        assertSchema(DatasetMixedInputSchema, input, `${prefix}invalid input`),
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
     * @param input - an array of LinkedIn profile URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the profile data or snapshot meta
     */
    collectProfiles(input: string[], opt: CollectOptions) {
        this.logger.info(`collectProfiles for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectProfiles');
        return this.run(safeInput, DATASET_ID.PROFILE, safeOpt);
    }
    /**
     * Find LinkedIn profile data based on provided filters.
     * @param input - an array of filters to starts collection for
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with snapshot meta
     */
    discoverProfiles(input: LinkedinProfileFilter[], opt: DiscoverOptions) {
        this.logger.info(`discoverProfiles for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'discoverProfiles',
        );
        return this.run(safeInput, DATASET_ID.PROFILE, {
            ...safeOpt,
            async: true,
            type: 'discover_new',
            discoverBy: 'name',
        });
    }
    /**
     * Fetch LinkedIn company data for one or more company URLs.
     * @param input - a single LinkedIn company URL or an array of company URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the company data or snapshot meta
     */
    collectCompanies(input: string[], opt: CollectOptions) {
        this.logger.info(`collectCompanies for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'collectCompanies',
        );
        return this.run(safeInput, DATASET_ID.COMPANY, safeOpt);
    }
    /**
     * Fetch LinkedIn job posting data for one or more job URLs.
     * @param input - a single LinkedIn job URL or an array of job URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the job data or snapshot meta
     */
    collectJobs(input: string[], opt: CollectOptions) {
        this.logger.info(`collectJobs for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectJobs');
        return this.run(safeInput, DATASET_ID.JOB, safeOpt);
    }
    /**
     * Find LinkedIn job postings data based on provided filters
     * @param input - an array of filters to starts collection for
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with snapshot meta
     */
    discoverJobs(input: LinkedinJobFilter[], opt: DiscoverOptions) {
        const [safeInput, safeOpt] = assertInput(input, opt, 'discoverJobs');
        return this.run(safeInput, DATASET_ID.JOB, {
            ...safeOpt,
            async: true,
            type: 'discover_new',
            discoverBy: 'keyword',
        });
    }
    /**
     * Fetch LinkedIn post data for one or more post URLs.
     * @param input - a single LinkedIn post URL or an array of post URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the post data or snapshot meta
     */
    collectPosts(input: string[], opt: CollectOptions) {
        this.logger.info(`collectPosts for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectPosts');
        return this.run(safeInput, DATASET_ID.POST, safeOpt);
    }
    /**
     * Find LinkedIn user posts data based on provided urls
     * @param input - an array of filters to starts collection for
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with snapshot meta
     */
    discoverUserPosts(input: UrlFilter[], opt: DiscoverOptions) {
        this.logger.info(`discoverUserPosts for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'discoverUserPosts',
        );
        return this.run(safeInput, DATASET_ID.POST, {
            ...safeOpt,
            async: true,
            type: 'discover_new',
            discoverBy: 'profile_url',
        });
    }
    /**
     * Find LinkedIn company posts data based on provided urls
     * @param input - an array of filters to starts collection for
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with snapshot meta
     */
    discoverCompanyPosts(input: UrlFilter[], opt: DiscoverOptions) {
        this.logger.info(`discoverCompanyPosts for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'discoverCompanyPosts',
        );
        return this.run(safeInput, DATASET_ID.POST, {
            ...safeOpt,
            async: true,
            type: 'discover_new',
            discoverBy: 'company_url',
        });
    }
}
