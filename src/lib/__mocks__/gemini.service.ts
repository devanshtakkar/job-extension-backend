import { vi } from 'vitest';

export const processQuestions = vi.fn().mockResolvedValue([
    {
        question: "Are you willing to relocate?",
        answer: "Yes",
        inputElmType: "radio",
        answerElmId: "input-q1-1",
        wasAvailable: true
    }
]);
