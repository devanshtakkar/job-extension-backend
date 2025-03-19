import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { processQuestions } from '../lib/gemini.service';
import prisma from '../lib/prisma';

vi.mock('../lib/gemini.service');
vi.mock('../lib/prisma', () => ({
    default: {
        user: {
            findUnique: vi.fn().mockResolvedValue({ id: 123, credits: 100 })
        },
        questions: {
            createMany: vi.fn().mockResolvedValue({ count: 1 })
        }
    }
}));

describe('POST /api/process-questions', () => {
    const validQuestion = {
        id: "q1",
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

    it('should process questions successfully and store in database', async () => {
        const validRequest = {
            userId: "123",
            applicationId: "456",
            platform: "indeed",
            questions: [validQuestion]
        };
        
        const response = await request(app)
            .post('/api/process-questions')
            .send(validRequest);

        expect(response.status).toBe(200);
        // Verify API response
        expect(response.body).toEqual([
            {
                id: "q1",
                question: "Are you willing to relocate?",
                answer: "Yes",
                inputElmType: "radio",
                answerElmId: "input-q1-1",
                wasAvailable: true
            }
        ]);

        // Verify database operations
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: 123 }
        });

        expect(prisma.questions.createMany).toHaveBeenCalledWith({
            data: [{
                userId: 123,
                applicationId: 456,
                platform: "indeed",
                data: validQuestion,
                ai_answer: {
                    id: "q1",
                    question: "Are you willing to relocate?",
                    answer: "Yes",
                    inputElmType: "radio",
                    answerElmId: "input-q1-1",
                    wasAvailable: true
                }
            }]
        });
    });

    it('should return 404 if user not found', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
        
        const validRequest = {
            userId: "123",
            applicationId: "456",
            platform: "indeed",
            questions: [validQuestion]
        };

        const response = await request(app)
            .post('/api/process-questions')
            .send(validRequest);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'User not found',
            message: 'No user found with id 123'
        });
    });

    it('should return 400 for invalid request body - missing required fields', async () => {
        const invalidRequest = {
            // Missing userId, applicationId, platform
            questions: [validQuestion]
        };

        const response = await request(app)
            .post('/api/process-questions')
            .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation Error');
        expect(response.body).toHaveProperty('details');
    });

    it('should return 400 for invalid question format', async () => {
        const invalidRequest = {
            userId: "123",
            applicationId: "456",
            platform: "indeed",
            questions: [{
                // Missing required fields in question
                question: "Are you willing to relocate?"
            }]
        };

        const response = await request(app)
            .post('/api/process-questions')
            .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation Error');
        expect(response.body).toHaveProperty('details');
    });

    it('should handle processing error', async () => {
        const validRequest = {
            userId: "123",
            applicationId: "456",
            platform: "indeed",
            questions: [validQuestion]
        };

        vi.mocked(processQuestions).mockRejectedValueOnce(new Error('Processing failed'));

        const response = await request(app)
            .post('/api/process-questions')
            .send(validRequest);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: 'Internal Server Error',
            message: 'Failed to process questions with AI'
        });
    });
});
