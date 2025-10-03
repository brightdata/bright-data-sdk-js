import { z } from 'zod';

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
