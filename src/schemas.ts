import { z } from 'zod';
import { ValidationError } from './utils/errors';
import { DEFAULT_CONCURRENCY } from './utils/constants';

export const ApiKeySchema = z
    .string()
    .min(10, 'API key appears to be invalid (too short)');

export const VerboseSchema = z.stringbool().optional();

const SearchQuerySchema = z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(2048, 'Search query cannot exceed 2048 characters');

const SearchQueryListSchema = z
    .array(SearchQuerySchema)
    .max(50, 'Query list cannot contain more than 50 queries');

export const SearchQueryParamSchema = z.union([
    SearchQuerySchema,
    SearchQueryListSchema,
]);

const URLSchema = z
    .httpUrl('Invalid URL format')
    .min(1, 'URL cannot be empty')
    .max(8192, 'URL exceeds maximum length of 8192 characters');

const URLListSchema = z
    .array(URLSchema)
    .max(100, 'URL list cannot contain more than 100 URLs');

export const URLParamSchema = z.union([URLSchema, URLListSchema]);

export const ZoneNameSchema = z
    .string()
    .min(3, 'Zone name must be at least 3 characters long')
    .max(63, 'Zone name must not exceed 63 characters')
    .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Zone name can only contain letters, numbers, hyphens, and underscores',
    )
    .refine((val) => !val.startsWith('-') && !val.startsWith('_'), {
        message: 'Zone name cannot start with a hyphen or underscore',
    })
    .refine((val) => !val.endsWith('-') && !val.endsWith('_'), {
        message: 'Zone name cannot end with a hyphen or underscore',
    });

export const ClientOptionsSchema = z
    .object({
        apiKey: ApiKeySchema.optional(),
        webUnlockerZone: ZoneNameSchema.optional(),
        serpZone: ZoneNameSchema.optional(),
        logLevel: z
            .enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
            .optional(),
        verbose: z.boolean().optional(),
        structuredLogging: z.boolean().default(true),
        autoCreateZones: z.boolean().default(true),
    })
    .optional();

const RequestOptionsBaseSchema = z.object({
    zone: ZoneNameSchema.optional(),
    country: z
        .string()
        .length(
            2,
            'Country code must be exactly 2 characters (ISO 3166-1 alpha-2) or empty',
        )
        .transform((v) => v.toLowerCase())
        .optional(),
    method: z
        .enum(['GET', 'POST', 'get', 'post'])
        .transform((v) => v.toUpperCase() as 'GET' | 'POST')
        .optional(),
    format: z.enum(['json', 'raw']).optional(),
    dataFormat: z.enum(['html', 'markdown', 'screenshot']).optional(),
});

const FetchingOptionsSchema = z.object({
    concurrency: z.int().min(1).max(50).default(DEFAULT_CONCURRENCY),
    timeout: z.number().min(250).max(300_000).optional(),
});

export const ScrapeOptionsSchema = z
    .object({
        ...RequestOptionsBaseSchema.shape,
        ...FetchingOptionsSchema.shape,
    })
    .optional();

export const SearchOptionsSchema = z
    .object({
        ...RequestOptionsBaseSchema.shape,
        ...FetchingOptionsSchema.shape,
        searchEngine: z
            .enum(['google', 'bing', 'yandex', 'GOOGLE', 'BING', 'YANDEX'])
            .transform((v) => v.toLowerCase() as 'google' | 'bing' | 'yandex')
            .optional(),
    })
    .optional();

export function assertSchema<K>(
    schema: z.ZodType<K>,
    input: unknown,
): z.infer<typeof schema> {
    const inputParsed = schema.safeParse(input);

    if (!inputParsed.success)
        throw new ValidationError(z.prettifyError(inputParsed.error));

    return inputParsed.data;
}
