import { z } from 'zod';

const DatasetOptionsBaseSchema = z.object({
    customOutputFields: z.string().optional(),
    includeErrors: z.boolean().optional(),
});

const DatasetOptionsSyncSchema = z.object({
    ...DatasetOptionsBaseSchema.shape,
    async: z.literal(false).optional(),
    format: z.enum(['json', 'csv']).default('json'),
});

const DatasetOptionsAsyncSchema = z.object({
    ...DatasetOptionsBaseSchema.shape,
    async: z.literal(true),
    format: z.enum(['json', 'csv', 'ndjson', 'jsonl']).default('json'),
    type: z.literal('discover_new').optional(),
    discoverBy: z.string().optional(),
    limitPerInput: z.int().positive().optional(),
    limitMultipleResults: z.int().positive().optional(),
});

export const DatasetOptionsSchema = z.discriminatedUnion('async', [
    DatasetOptionsAsyncSchema,
    DatasetOptionsSyncSchema,
]);
