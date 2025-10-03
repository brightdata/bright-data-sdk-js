import { z } from 'zod';
import { DEFAULT_CONCURRENCY } from '../utils/constants';
import { ZoneNameSchema } from './shared';

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
