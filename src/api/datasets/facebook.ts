import type {
    DatasetOptions,
    UnknownRecord,
    FacebookCollectUserPostsFilter,
    FacebookCollectGroupPostsFilter,
    FacebookCollectPostCommentsFilter,
    InstagramDiscoverReelsByProfileURLFilter,
    FacebookCompanyReviewsFilter,
} from '../../types/datasets';
import {
    DatasetOptionsSchema,
    DatasetMixedInputSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import { BaseAPI, type BaseAPIOptions } from './base';

const DATASET_ID = {
    POSTS_USER: 'gd_lkaxegm826bjpoo9m5',
    POSTS_GROUP: 'gd_lz11l67o2cb3r0lkj3',
    COMMENTS: 'gd_lkay758p1eanlolqw8',
    MARKETPLACE: 'gd_lvt9iwuh6fbcwmx1a',
    POSTS: 'gd_lyclm1571iy3mv57zw',
    EVENTS: 'gd_m14sd0to1jz48ppm51',
    REELS_USER: 'gd_lyclm3ey2q6rww027t',
    REVIEWS_COMPANY: 'gd_m0dtqpiu1mbcyc2g86',
    PROFILES_USER: 'gd_mf0urb782734ik94dz',
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
     * Fetch Facebook user posts data for one or more profile URLs.
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
    /**
     * Fetch Facebook group posts data for one or more group URLs.
     * @param input - an array of Facebook group URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the group posts data or snapshot meta
     */
    collectGroupPosts(
        input: string[] | FacebookCollectGroupPostsFilter[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectGroupPosts for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'collectGroupPosts',
        );
        return this.run(safeInput, DATASET_ID.POSTS_GROUP, safeOpt);
    }
    /**
     * Fetch Facebook post comments data for one or more post URLs.
     * @param input - an array of Facebook post URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the post comments data or snapshot meta
     */
    collectPostComments(
        input: string[] | FacebookCollectPostCommentsFilter[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectPostComments for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'collectPostComments',
        );
        return this.run(safeInput, DATASET_ID.COMMENTS, safeOpt);
    }
    /**
     * Fetch Facebook post marketplace data for one or more item URLs.
     * @param input - an array of Facebook marketplace items URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the marketplace items data or snapshot meta
     */
    collectMarketplaceItems(
        input: string[] | UnknownRecord[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectMarketplaceItems for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'collectMarketplaceItems',
        );
        return this.run(safeInput, DATASET_ID.MARKETPLACE, safeOpt);
    }
    /**
     * Fetch Facebook posts data by one or more URLs.
     * @param input - an array of Facebook post URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the posts data or snapshot meta
     */
    collectPosts(input: string[] | UnknownRecord[], opt: DatasetOptions) {
        this.logger.info(`collectPosts for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectPosts');
        return this.run(safeInput, DATASET_ID.POSTS, safeOpt);
    }
    /**
     * Fetch Facebook events data by one or more URLs.
     * @param input - an array of Facebook event URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the events data or snapshot meta
     */
    collectEvents(input: string[] | UnknownRecord[], opt: DatasetOptions) {
        this.logger.info(`collectEvents for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectEvents');
        return this.run(safeInput, DATASET_ID.EVENTS, safeOpt);
    }
    /**
     * Fetch Instagram reels data by one or more profile URLs.
     * @param input - an array of Instagram profile URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the reels data or snapshot meta
     */
    collectUserReels(
        input: string[] | InstagramDiscoverReelsByProfileURLFilter[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectUserReels for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'collectUserReels',
        );
        return this.run(safeInput, DATASET_ID.REELS_USER, safeOpt);
    }
    /**
     * Fetch company reviews data by one or more company URLs.
     * @param input - an array of Facebook company URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the company reviews data or snapshot meta
     */
    collectCompanyReviews(
        input: string[] | FacebookCompanyReviewsFilter[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectCompanyReviews for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'collectCompanyReviews',
        );
        return this.run(safeInput, DATASET_ID.REVIEWS_COMPANY, safeOpt);
    }
    /**
     * Fetch user profile data by one or more profile URLs.
     * @param input - an array of Facebook profile URLs or filters
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the user profile data or snapshot meta
     */
    collectUserProfiles(
        input: string[] | UnknownRecord[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectUserProfiles for ${input.length} inputs`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'collectUserProfiles',
        );
        return this.run(safeInput, DATASET_ID.PROFILES_USER, safeOpt);
    }
}
