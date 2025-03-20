import { z } from 'zod';

export const QuestionOptionSchema = z.object({
    value: z.string(),
    label: z.string(),
    inputId: z.string()
});

export const QuestionSchema = z.object({
    id: z.string(),
    question: z.string(),
    inputElm: z.string(),
    elementId: z.string(),
    options: z.array(QuestionOptionSchema).optional()
});

export const ProcessQuestionsRequestSchema = z.object({
    userId: z.number(),
    applicationId: z.number(),
    platform: z.string(),
    questions: z.array(QuestionSchema)
}).passthrough(); // Allows extra parameters in request body

export const QuestionAnswerSchema = z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
    inputElmType: z.enum(['text', 'textarea', 'number', 'radio', 'select', 'tel']),
    answerElmId: z.string()
});

export const QuestionAnswersArraySchema = z.array(QuestionAnswerSchema);

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>;

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
