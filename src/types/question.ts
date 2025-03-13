import { z } from 'zod';

export const QuestionOptionSchema = z.object({
    value: z.string(),
    label: z.string(),
    inputId: z.string()
});

export const QuestionSchema = z.object({
    question: z.string(),
    inputElm: z.enum(['text', 'textarea', 'number', 'radio', 'select']),
    elementId: z.string(),
    options: z.array(QuestionOptionSchema).optional()
});

export const QuestionsArraySchema = z.array(QuestionSchema);

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

// Hardcoded user profile for now
export const userProfile = {
    name: "John Doe",
    education: "Bachelor's Degree in Computer Science",
    experience: {
        years: 5,
        skills: ["JavaScript", "TypeScript", "React", "Node.js"]
    },
    location: "Vancouver, BC",
    citizenship: "Canadian Citizen",
    languages: ["English"],
    portfolio: "https://johndoe.dev",
    availability: "Immediate"
};
