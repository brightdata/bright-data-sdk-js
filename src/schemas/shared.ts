import { z } from 'zod';

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
