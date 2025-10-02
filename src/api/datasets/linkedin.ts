import type { DatasetOptions } from '../../types';
import { BaseAPI, type BaseAPIOptions } from './base';

const DATASET_ID = {
    PROFILE: 'gd_l1viktl72bvl7bjuj0',
    COMPANY: 'gd_l1vikfnt1wgvvqz95w',
    JOB: 'gd_lpfll7v5hcqtkxl6l',
    POST: 'gd_lyy3tktm25m4avu764',
};

const getCount = (val: string | string[]) =>
    Array.isArray(val) ? val.length : 1;

export class LinkedinAPI extends BaseAPI {
    constructor(opts: BaseAPIOptions) {
        super(opts);
        this.name = 'linkedin';
        this.init();
    }

    getProfiles(val: string | string[], opt: DatasetOptions) {
        this.logger.info(
            `fetching linkedin profiles for ${getCount(val)} urls`,
        );

        return this.invoke(val, DATASET_ID.PROFILE, opt);
    }

    getCompanies(val: string | string[], opt: DatasetOptions) {
        this.logger.info(
            `fetching linkedin companies for ${getCount(val)} urls`,
        );
        return this.invoke(val, DATASET_ID.COMPANY, opt);
    }

    getJobs(val: string | string[], opt: DatasetOptions) {
        this.logger.info(`fetching linkedin jobs for ${getCount(val)} urls`);
        return this.invoke(val, DATASET_ID.JOB, opt);
    }

    getPosts(val: string | string[], opt: DatasetOptions) {
        this.logger.info(`fetching linkedin posts for ${getCount(val)} urls`);
        return this.invoke(val, DATASET_ID.POST, opt);
    }
}
