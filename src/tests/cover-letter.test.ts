import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { generateCoverLetter } from '../lib/gemini.service';

// Mock the Gemini service
vi.mock('../lib/gemini.service', () => ({
    generateCoverLetter: vi.fn()
}));

describe('POST /api/generate-cover-letter', () => {
    const mockJobDetails = {
        title: "Senior Software Engineer",
        company: "Tech Corp",
        description: "We are looking for an experienced software engineer to join our team.",
        requirements: ["5+ years experience", "React", "Node.js"],
        location: "Vancouver, BC"
    };

    const mockCoverLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at Tech Corp. With over 5 years of experience in software development, I am confident in my ability to contribute to your team.

Throughout my career at Tech Solutions Inc, I have led the development of multiple web applications using React and Node.js, which aligns perfectly with your requirements. I have a proven track record of delivering high-quality solutions and working effectively in team environments.

I would welcome the opportunity to discuss how my skills and experience can benefit Tech Corp. Thank you for considering my application.

Best regards,
Devansh Takkar
Vancouver, BC | devanshtakkar@gmail.com
    `.trim();

    beforeEach(() => {
        vi.resetAllMocks();
        (generateCoverLetter as any).mockResolvedValue(mockCoverLetter);
    });

    it('should generate a cover letter successfully', async () => {
        const response = await request(app)
            .post('/api/generate-cover-letter')
            .send({ jobDetails: mockJobDetails });
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ coverLetter: mockCoverLetter });
        expect(generateCoverLetter).toHaveBeenCalledWith(mockJobDetails, undefined);
    });

    it('should include user input when provided', async () => {
        const userInput = "I'm particularly excited about this role because of the innovative projects.";
        
        const response = await request(app)
            .post('/api/generate-cover-letter')
            .send({ 
                jobDetails: mockJobDetails,
                userInput 
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ coverLetter: mockCoverLetter });
        expect(generateCoverLetter).toHaveBeenCalledWith(mockJobDetails, userInput);
    });

    it('should validate job details are provided', async () => {
        const response = await request(app)
            .post('/api/generate-cover-letter')
            .send({ userInput: 'some input' });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should validate job details is an object', async () => {
        const response = await request(app)
            .post('/api/generate-cover-letter')
            .send({ 
                jobDetails: 'not an object',
                userInput: 'some input' 
            });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should validate userInput is a string if provided', async () => {
        const response = await request(app)
            .post('/api/generate-cover-letter')
            .send({ 
                jobDetails: mockJobDetails,
                userInput: 123 // not a string
            });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should handle internal server errors', async () => {
        const error = new Error('Failed to generate cover letter');
        (generateCoverLetter as any).mockRejectedValue(error);

        const response = await request(app)
            .post('/api/generate-cover-letter')
            .send({ jobDetails: mockJobDetails });
        
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
});
