import type {
    DatasetOptions,
    UnknownRecord,
    FacebookCollectUserPostsFilter,
} from '../../types/datasets';
import {
    DatasetOptionsSchema,
    DatasetMixedInputSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import { BaseAPI, type BaseAPIOptions } from './base';

const DATASET_ID = {
    POSTS_USER: 'gd_lkaxegm826bjpoo9m5',
};

const assertInput = (
    input: UnknownRecord[] | string[],
    opts: DatasetOptions = {},
    fn: string,
) => {
    const prefix = `facebook.${fn}: `;
    return [
        assertSchema(DatasetMixedInputSchema, input, `${prefix}invalid input`),
        assertSchema(DatasetOptionsSchema, opts, `${prefix}invalid options`),
    ] as const;
};

export class FacebookAPI extends BaseAPI {
    constructor(opts: BaseAPIOptions) {
        super(opts);
        this.name = 'facebook';
        this.init();
    }
    /**
     * Fetch Facebook profile data for one or more profile URLs.
     * @param input - an array of Facebook profile URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the profile data or snapshot meta
     */
    collectUserPosts(
        input: string[] | FacebookCollectUserPostsFilter[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectUserPosts for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'collectUserPosts',
        );
        return this.run(safeInput, DATASET_ID.POSTS_USER, safeOpt);
    }
}
