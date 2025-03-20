import { z } from 'zod';

export const ApplicationStatus = z.enum(['STARTED', 'COMPLETED', 'ERROR']);

export const CreateIndeedApplicationSchema = z.object({
    userId: z.number(),
    jobDesc: z.string(),
    title: z.string(),
    employer: z.string(),
    applicationUrl: z.string()
}).passthrough(); // Allows extra parameters in request body

export const UpdateIndeedApplicationSchema = z.object({
    userId: z.number(),
    applicationId: z.number(),
    status: ApplicationStatus
});

export type CreateIndeedApplication = z.infer<typeof CreateIndeedApplicationSchema>;
export type UpdateIndeedApplication = z.infer<typeof UpdateIndeedApplicationSchema>;
