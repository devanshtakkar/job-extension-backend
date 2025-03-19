import { z } from 'zod';

export const CreateIndeedApplicationSchema = z.object({
    userId: z.number(),
    jobDesc: z.string(),
    title: z.string(),
    employer: z.string(),
    applicationUrl: z.string()
}).passthrough(); // Allows extra parameters in request body

export type CreateIndeedApplication = z.infer<typeof CreateIndeedApplicationSchema>;
