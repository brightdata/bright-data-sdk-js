import type {
    DatasetOptions,
    DiscoverOptions,
    UnknownRecord,
    InstagramDiscoverPostsByProfileURLFilter,
    InstagramDiscoverReelsByProfileURLFilter,
} from '../../types/datasets';
import {
    DatasetOptionsSchema,
    DatasetMixedInputSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import { BaseAPI, type BaseAPIOptions } from './base';

const DATASET_ID = {
    PROFILE: 'gd_l1vikfch901nx3by4',
    POST: 'gd_lk5ns7kz21pck8jpis',
    REEL: 'gd_lyclm20il4r5helnj',
    COMMENT: 'gd_ltppn085pokosxh13',
};

const assertInput = (
    input: UnknownRecord[] | string[],
    opts: DatasetOptions = {},
    fn: string,
) => {
    const prefix = `instagram.${fn}: `;
    return [
        assertSchema(DatasetMixedInputSchema, input, `${prefix}invalid input`),
        assertSchema(DatasetOptionsSchema, opts, `${prefix}invalid options`),
    ] as const;
};

export class InstagramAPI extends BaseAPI {
    constructor(opts: BaseAPIOptions) {
        super(opts);
        this.name = 'instagram';
        this.init();
    }
    /**
     * Fetch Instagram profile data for one or more profile URLs.
     * @param input - an array of Instagram profile URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the profile data or snapshot meta
     */
    collectProfiles(input: string[], opt: DatasetOptions) {
        this.logger.info(`collectProfiles for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectProfiles');
        return this.run(safeInput, DATASET_ID.PROFILE, safeOpt);
    }
    /**
     * Fetch Instagram post data for one or more post URLs.
     * @param input - an array of Instagram post URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the post data or snapshot meta
     */
    collectPosts(input: string[], opt: DatasetOptions) {
        this.logger.info(`collectPosts for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectPosts');
        return this.run(safeInput, DATASET_ID.POST, safeOpt);
    }
    /**
     * Discover Instagram posts by profile URL
     * @param input - an array of filters to starts collection for
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with snapshot meta
     */
    discoverPostsByProfileURL(
        input: string[] | InstagramDiscoverPostsByProfileURLFilter[],
        opt: DiscoverOptions,
    ) {
        this.logger.info(`discoverPostsByProfileURL for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'discoverPostsByProfileURL',
        );
        return this.run(safeInput, DATASET_ID.POST, {
            ...safeOpt,
            async: true,
            type: 'discover_new',
            discoverBy: 'url',
        });
    }
    /**
     * Fetch Instagram reel data for one or more reel URLs.
     * @param input - an array of Instagram reel URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the reel data or snapshot meta
     */
    collectReels(input: string[], opt: DatasetOptions) {
        this.logger.info(`collectReels for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectReels');
        return this.run(safeInput, DATASET_ID.REEL, safeOpt);
    }
    /**
     * Discover reels video from Instagram profile or direct search url
     * @param input - an array of filters to starts collection for
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with snapshot meta
     */
    discoverReelsByProfileURL(
        input: string[] | InstagramDiscoverReelsByProfileURLFilter[],
        opt: DiscoverOptions,
    ) {
        this.logger.info(`discoverReelsByProfileURL for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'discoverReelsByProfileURL',
        );
        return this.run(safeInput, DATASET_ID.REEL, {
            ...safeOpt,
            async: true,
            type: 'discover_new',
            discoverBy: 'url',
        });
    }
    /**
     * Collect all Reels from Instagram profiles (without the post timestamp)
     * @param input - an array of filters to starts collection for
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with snapshot meta
     */
    discoverAllReelsByProfileURL(
        input: string[] | InstagramDiscoverReelsByProfileURLFilter[],
        opt: DiscoverOptions,
    ) {
        this.logger.info(
            `discoverAllReelsByProfileURL for ${input.length} urls`,
        );
        const [safeInput, safeOpt] = assertInput(
            input,
            opt,
            'discoverAllReelsByProfileURL',
        );
        return this.run(safeInput, DATASET_ID.REEL, {
            ...safeOpt,
            async: true,
            type: 'discover_new',
            discoverBy: 'url_all_reels',
        });
    }
    /**
     * Fetch Instagram comments data for one or more post URLs.
     * @param input - an array of Instagram post URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the comments data or snapshot meta
     */
    collectComments(input: string[], opt: DatasetOptions) {
        this.logger.info(`collectComments for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectComments');
        return this.run(safeInput, DATASET_ID.COMMENT, safeOpt);
    }
}
