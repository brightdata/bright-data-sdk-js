import type { DatasetOptions, UnknownRecord, ChatgptFilter } from '../../types';
import {
    DatasetOptionsSchema,
    ChatGPTInputSchema,
} from '../../schemas/datasets';
import { assertSchema } from '../../schemas/utils';
import { BaseAPI, type BaseAPIOptions } from './base';

const DATASET_ID = {
    CHATGPT: 'gd_m7aof0k82r803d5bjm',
};

const assertInput = (
    input: UnknownRecord[],
    opts: DatasetOptions = {},
    fn: string,
) => {
    const prefix = `chatgpt.${fn}: `;
    return [
        assertSchema(ChatGPTInputSchema, input, `${prefix}invalid input`),
        assertSchema(DatasetOptionsSchema, opts, `${prefix}invalid options`),
    ] as const;
};

export class ChatgptAPI extends BaseAPI {
    constructor(opts: BaseAPIOptions) {
        super(opts);
        this.name = 'chatgpt';
        this.init();
    }
    /**
     * Fetch ChatGPT responses for one or more prompts.
     * @param input - an array
     * @param opt - dataset options to control the request behavior
     * @returns a promise that resolves with the response data or snapshot meta
     */
    search(input: ChatgptFilter[], opt: DatasetOptions) {
        this.logger.info(`search for ${input.length} prompts`);
        const [safeInput, safeOpt] = assertInput(input, opt, 'search');
        return this.run(safeInput, DATASET_ID.CHATGPT, safeOpt);
    }
}
