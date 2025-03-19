import express, { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import cors from 'cors';
import dotenv from 'dotenv';
import { QuestionsArraySchema } from './types/question';
import { processQuestions, generateCoverLetter } from './lib/gemini.service';
import { CreateIndeedApplicationSchema } from './types/indeed-application';
import prisma from './lib/prisma';

dotenv.config();

const app = express();

app.use(cors());
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Process questions endpoint and cover letter endpoints
app.post('/api/process-questions', async (req: Request, res: Response) => {
    try {
        // Validate the request body
        const questions = QuestionsArraySchema.parse(req.body);
        
        // Process questions with Gemini AI
        const aiResponse = await processQuestions(questions);
        
        res.json(aiResponse);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Validation Error',
                details: error.errors
            });
            return;
        }
        
        console.error('Error processing questions:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to process questions with AI'
        });
    }
});

// Generate cover letter endpoint
app.post('/api/generate-cover-letter', async (req: Request, res: Response) => {
    try {
        const { jobDetails, userInput } = req.body;
        
        if (!jobDetails || typeof jobDetails !== 'object') {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Job details are required and must be an object'
            });
            return;
        }

        if (userInput !== undefined && typeof userInput !== 'string') {
            res.status(400).json({
                error: 'Validation Error',
                message: 'User input must be a string if provided'
            });
            return;
        }
        
        const coverLetter = await generateCoverLetter(jobDetails, userInput);
        res.json({ coverLetter });
    } catch (error) {
        console.error('Error generating cover letter:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate cover letter'
        });
    }
});

// Indeed application creation endpoint
app.post('/api/indeed-application', async (req: Request, res: Response) => {
    try {
        const data = CreateIndeedApplicationSchema.parse(req.body);
        
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: data.userId }
        });

        if (!user) {
            res.status(404).json({
                error: 'User not found',
                message: `No user found with id ${data.userId}`
            });
            return;
        }

        // Create indeed application
        const application = await prisma.indeedApplication.create({
            data: {
                userId: data.userId,
                jobDesc: data.jobDesc,
                title: data.title,
                employer: data.employer,
                applicationUrl: data.applicationUrl
            }
        });

        res.status(201).json(application);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Validation Error',
                details: error.errors
            });
            return;
        }
        
        console.error('Error creating application:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create application'
        });
    }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Only start server if this file is run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

export default app;
