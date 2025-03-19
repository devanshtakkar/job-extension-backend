import { vi } from 'vitest';

export const processQuestions = vi.fn().mockResolvedValue([
    {
        id: "q1",
        question: "Are you willing to relocate?",
        answer: "Yes",
        inputElmType: "radio",
        answerElmId: "input-q1-1",
        wasAvailable: true
    }
]);

export const generateCoverLetter = vi.fn().mockResolvedValue('Mock cover letter content');
