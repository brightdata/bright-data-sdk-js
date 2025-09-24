import { z } from 'zod';
import { ValidationError } from './utils/errors';
import { DEFAULT_CONCURRENCY } from './utils/constants';

export const ApiKeySchema = z
    .string()
    .min(10, 'API key appears to be invalid (too short)');

export const VerboseSchema = z.stringbool().optional();

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

const URLSchema = z
    .httpUrl('invalid URL format')
    .min(1, 'URL cannot be empty')
    .max(8192, 'URL exceeds maximum length of 8192 characters');

const URLListSchema = z.array(URLSchema).min(1, 'URL list cannot be empty');

export const URLParamSchema = z.union([URLSchema, URLListSchema]);

export const ZoneNameSchema = z
    .string()
    .trim()
    .min(3, 'zone name must be at least 3 characters long')
    .max(63, 'zone name must not exceed 63 characters')
    .regex(
        /^[a-z0-9_]+$/,
        'zone name can only contain letters, numbers, and underscores',
    )
    .refine((val) => !val.startsWith('_'), {
        message: 'zone name cannot start with an underscore',
    })
    .refine((val) => !val.endsWith('_'), {
        message: 'zone name cannot end with an underscore',
    });

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

const RequestOptionsBaseSchema = z.object({
    zone: ZoneNameSchema.optional(),
    country: z
        .string()
        .length(
            2,
            'country code must be exactly 2 characters (ISO 3166-1 alpha-2) or empty',
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

export const SearchOptionsSchema = z.object({
    ...RequestOptionsBaseSchema.shape,
    ...FetchingOptionsSchema.shape,
    searchEngine: z
        .enum(['google', 'bing', 'yandex', 'GOOGLE', 'BING', 'YANDEX'])
        .transform((v) => v.toLowerCase() as 'google' | 'bing' | 'yandex')
        .optional(),
});

const ContentFormatSchema = z
    .enum(['json', 'txt', 'JSON', 'TXT'])
    .transform((v) => v.toLowerCase() as 'json' | 'txt')
    .default('json');

const FilenameSchema = z
    .string()
    .min(1)
    .transform((v) => v.replace(/[<>:"\\|?*]/g, '_'));

export const SaveOptionsSchema = z.object({
    filename: FilenameSchema.optional(),
    format: ContentFormatSchema,
});

export function assertSchema<K>(
    schema: z.ZodType<K>,
    input: unknown,
): z.infer<typeof schema> {
    const inputParsed = schema.safeParse(input);

    if (!inputParsed.success)
        throw new ValidationError(z.prettifyError(inputParsed.error));

    return inputParsed.data;
}
