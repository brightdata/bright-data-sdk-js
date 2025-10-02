import { z } from 'zod';

const DatasetOptionsBaseSchema = z.object({
    customOutputFields: z.string().optional(),
    includeErrors: z.boolean().optional(),
});

const SnapshotFormatSchema = z
    .enum(['json', 'csv', 'ndjson', 'jsonl'])
    .transform((v) => (v === 'ndjson' ? 'jsonl' : v))
    .default('jsonl');

const DatasetOptionsSyncSchema = z.object({
    ...DatasetOptionsBaseSchema.shape,
    async: z.literal(false).optional(),
    format: SnapshotFormatSchema,
});

const DatasetOptionsAsyncSchema = z.object({
    ...DatasetOptionsBaseSchema.shape,
    async: z.literal(true),
    format: SnapshotFormatSchema,
    type: z.literal('discover_new').optional(),
    discoverBy: z.string().optional(),
    limitPerInput: z.int().positive().optional(),
    limitMultipleResults: z.int().positive().optional(),
});

export const DatasetOptionsSchema = z.discriminatedUnion('async', [
    DatasetOptionsAsyncSchema,
    DatasetOptionsSyncSchema,
]);

export const DatasetInputSchema = z.union([z.httpUrl(), z.array(z.httpUrl())]);

export const SnapshotDownloadOptionsSchema = z.object({
    format: SnapshotFormatSchema,
    compress: z.boolean().default(false),
});

export const SnapshotIdSchema = z
    .string()
    .trim()
    .min(3, 'snapshot id must be at least 3 characters long');
