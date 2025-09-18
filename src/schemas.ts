import { z } from 'zod';

export const ApiKeySchema = z
    .string()
    .min(1, 'API key appears to be invalid (too short)');

export const ClientOptionsSchema = z
    .object({
        apiKey: ApiKeySchema.optional(),
        autoCreateZones: z.boolean().default(true).optional(),
        webUnlockerZone: z.string().optional(),
        serpZone: z.string().optional(),
        logLevel: z
            .enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
            .optional(),
        structuredLogging: z.boolean().default(true).optional(),
        verbose: z.boolean().default(false).optional(),
    })
    .optional();
