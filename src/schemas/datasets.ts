import { z } from 'zod';

const SnapshotFormatSchema = z
    .enum(['json', 'csv', 'ndjson', 'jsonl'])
    .transform((v) => (v === 'ndjson' ? 'jsonl' : v))
    .default('jsonl');

const DatasetOptionsBaseSchema = z.object({
    customOutputFields: z.string().optional(),
    includeErrors: z.boolean().optional(),
    format: SnapshotFormatSchema,
});

const DatasetOptionsSyncSchema = z.object({
    ...DatasetOptionsBaseSchema.shape,
    async: z.literal(false).optional(),
});

const DatasetOptionsAsyncSchema = z.object({
    ...DatasetOptionsBaseSchema.shape,
    async: z.literal(true),
    type: z.literal('discover_new').optional(),
    discoverBy: z.string().optional(),
    limitPerInput: z.int().positive().optional(),
    limitMultipleResults: z.int().positive().optional(),
    notify: z.httpUrl().optional(),
    endpoint: z.httpUrl().optional(),
    authHeader: z.string().optional(),
    uncompressedWebhook: z.boolean().default(true),
});

export const DatasetOptionsSchema = z.discriminatedUnion('async', [
    DatasetOptionsAsyncSchema,
    DatasetOptionsSyncSchema,
]);

const DatasetURLInputSchema = z.array(z.httpUrl());
const DatasetInputSchema = z.array(z.record(z.string(), z.any()));

export const DatasetMixedInputSchema = z
    .union(
        [DatasetURLInputSchema, DatasetInputSchema],
        'Expected array of URLs or filter objects',
    )
    .transform((v) =>
        v.map((item) => (typeof item === 'string' ? { url: item } : item)),
    );

export const ChatGPTInputSchema = z
    .clone(DatasetMixedInputSchema)
    .transform((v) =>
        v.map((item) => ({ ...item, url: 'https://chatgpt.com/' })),
    );

export const SnapshotDownloadOptionsSchema = z.object({
    format: SnapshotFormatSchema,
    compress: z.boolean().default(false),
});

export const SnapshotIdSchema = z
    .string()
    .trim()
    .min(3, 'snapshot id must be at least 3 characters long');
