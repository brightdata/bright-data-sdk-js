import type {
    DatasetOptions,
    UnknownRecord,
    AmazonCollectProductsFilter,
    AmazonCollectReviewsFilter,
} from '../../types/datasets';
import {
    DatasetOptionsSchema,
    DatasetMixedInputSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import { BaseAPI, type BaseAPIOptions } from './base';

const DATASET_ID = {
    PRODUCT: 'gd_l7q7dkf244hwjntr0',
    REVIEW: 'gd_le8e811kzy4ggddlq',
    SELLER: 'gd_lhotzucw1etoe5iw1k',
    SEARCH: 'gd_lwdb4vjm1ehb499uxs',
};

const assertInput = (
    input: UnknownRecord[] | string[],
    opts: DatasetOptions = {},
    fn: string,
) => {
    const prefix = `amazon.${fn}: `;
    return [
        assertSchema(DatasetMixedInputSchema, input, `${prefix}invalid input`),
        assertSchema(DatasetOptionsSchema, opts, `${prefix}invalid options`),
    ] as const;
};

export class AmazonAPI extends BaseAPI {
    constructor(opts: BaseAPIOptions) {
        super(opts);
        this.name = 'amazon';
        this.init();
    }
    /**
     * fetch Amazon products for one or more URLs
     * @param input - an array of URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the response data or snapshot meta
     */
    collectProducts(
        input: string[] | AmazonCollectProductsFilter[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectProducts for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectProducts');
        return this.run(safeInput, DATASET_ID.PRODUCT, safeOpt);
    }
    /**
     * fetch Amazon product reviews by product URLs
     * @param input - an array of URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the response data or snapshot meta
     */
    collectReviews(
        input: string[] | AmazonCollectReviewsFilter[],
        opt: DatasetOptions,
    ) {
        this.logger.info(`collectReviews for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectReviews');
        return this.run(safeInput, DATASET_ID.REVIEW, safeOpt);
    }
    /**
     * fetch Amazon seller information by URLs
     * @param input - an array of URLs
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the response data or snapshot meta
     */
    collectSellers(input: string[], opt: DatasetOptions) {
        this.logger.info(`collectSellers for ${input.length} urls`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'collectSellers');
        return this.run(safeInput, DATASET_ID.SELLER, safeOpt);
    }
}
