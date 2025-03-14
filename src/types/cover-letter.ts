import { z } from 'zod';

export const JobDetailsSchema = z.object({
    title: z.string(),
    company: z.string(),
    description: z.string(),
    requirements: z.array(z.string()).optional(),
    location: z.string().optional()
});

export type JobDetails = z.infer<typeof JobDetailsSchema>;
