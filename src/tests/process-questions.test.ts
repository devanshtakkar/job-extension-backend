import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { processQuestions } from '../lib/gemini.service';

vi.mock('../lib/gemini.service');

describe('POST /api/process-questions', () => {
    const validQuestion = {
        question: "Are you willing to relocate?",
        inputElm: "radio",
        elementId: "input-q1",
        options: [
            {
                value: "1",
                label: "Yes",
                inputId: "input-q1-1"
            },
            {
                value: "2",
                label: "No",
                inputId: "input-q1-2"
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should process questions successfully', async () => {
        const response = await request(app)
            .post('/api/process-questions')
            .send([validQuestion]);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                question: "Are you willing to relocate?",
                answer: "Yes",
                inputElmType: "radio",
                answerElmId: "input-q1-1",
                wasAvailable: true
            }
        ]);
    });

    it('should return 400 for invalid request body', async () => {
        const invalidQuestion = {
            // Missing required fields
            question: "Are you willing to relocate?"
        };

        const response = await request(app)
            .post('/api/process-questions')
            .send([invalidQuestion]);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation Error');
        expect(response.body).toHaveProperty('details');
    });

    it('should handle processing error', async () => {
        vi.mocked(processQuestions).mockRejectedValueOnce(new Error('Processing failed'));

        const response = await request(app)
            .post('/api/process-questions')
            .send([validQuestion]);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: 'Internal Server Error',
            message: 'Failed to process questions with AI'
        });
    });
});
