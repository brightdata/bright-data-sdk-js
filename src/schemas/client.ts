import { z } from 'zod';
import { ZoneNameSchema } from './shared';

export const ApiKeySchema = z
    .string()
    .min(10, 'API key appears to be invalid (too short)');

export const VerboseSchema = z.stringbool().optional();

export const ClientOptionsSchema = z.object({
    apiKey: ApiKeySchema.optional(),
    webUnlockerZone: ZoneNameSchema.optional(),
    serpZone: ZoneNameSchema.optional(),
    logLevel: z
        .enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
        .optional(),
    verbose: z.boolean().optional(),
    structuredLogging: z.boolean().default(true),
    autoCreateZones: z.boolean().default(true),
});

const URLSchema = z
    .httpUrl('invalid URL format')
    .min(1, 'URL cannot be empty')
    .max(8192, 'URL exceeds maximum length of 8192 characters');

const URLListSchema = z.array(URLSchema).min(1, 'URL list cannot be empty');

export const URLParamSchema = z.union([URLSchema, URLListSchema]);

const SearchQuerySchema = z
    .string()
    .trim()
    .min(1, 'search query cannot be empty')
    .max(2048, 'search query cannot exceed 2048 characters');

const SearchQueryListSchema = z
    .array(SearchQuerySchema)
    .min(1, 'search query list cannot be empty');

export const SearchQueryParamSchema = z.union([
    SearchQuerySchema,
    SearchQueryListSchema,
]);
