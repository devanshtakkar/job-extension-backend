import express, { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import cors from 'cors';
import dotenv from 'dotenv';
import { ProcessQuestionsRequestSchema, QuestionAnswersArraySchema } from './types/question';
import { processQuestions, generateCoverLetter } from './lib/gemini.service';
import { CreateIndeedApplicationSchema, UpdateIndeedApplicationSchema } from './types/indeed-application';
import authRoutes from './routes/auth.routes';
import checkboxRoutes from './routes/checkbox.routes';
import prisma from './lib/prisma';

dotenv.config();

const app = express();

app.use(cors());
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/checkbox', checkboxRoutes);

// Process questions endpoint and cover letter endpoints
app.post('/api/process-questions', async (req: Request, res: Response) => {
    try {
        // Validate the request body
        const requestData = ProcessQuestionsRequestSchema.parse(req.body);
        
        // Process questions with Gemini AI
        const aiResponse = await processQuestions(requestData.questions);
        
        try {
            // Validate AI response format
            const validatedResponse = QuestionAnswersArraySchema.parse(aiResponse);
            
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: Number(requestData.userId) }
            });

            if (!user) {
                res.status(404).json({
                    error: 'User not found',
                    message: `No user found with id ${requestData.userId}`
                });
                return;
            }

            // Create a map of AI answers for easier lookup
            const answersMap = validatedResponse.reduce((acc, answer) => {
                acc[answer.id] = answer;
                return acc;
            }, {} as Record<string, typeof validatedResponse[0]>);

            // Prepare data for batch insert
            const questionsData = requestData.questions.map(question => ({
                userId: Number(requestData.userId),
                applicationId: requestData.applicationId ? Number(requestData.applicationId) : undefined,
                platform: requestData.platform,
                data: question,
                ai_answer: answersMap[question.id]
            }));

            // Store questions and AI responses in database
            await prisma.questions.createMany({
                data: questionsData
            });

            res.json(validatedResponse);
        } catch (validationError) {
            // AI response validation failure is a server error
            console.error('Invalid AI response format:', validationError);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'AI response format was invalid'
            });
            return;
        }
    } catch (error) {
        console.log(error)
        // Request body validation error
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Validation Error',
                message: error.errors
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

// Update indeed application status endpoint
app.put('/api/indeed-application/:applicationId', async (req: Request, res: Response) => {
    try {
        const data = UpdateIndeedApplicationSchema.parse({
            userId: Number(req.body.userId),
            applicationId: Number(req.params.applicationId),
            status: req.body.status
        });

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

        // Check if application exists and belongs to user
        const existingApplication = await prisma.indeedApplication.findFirst({
            where: {
                id: data.applicationId,
                userId: data.userId
            }
        });

        if (!existingApplication) {
            res.status(404).json({
                error: 'Application not found',
                message: `No application found with id ${data.applicationId} for user ${data.userId}`
            });
            return;
        }

        // Update application status
        const updatedApplication = await prisma.indeedApplication.update({
            where: {
                id: data.applicationId
            },
            data: {
                status: data.status
            }
        });

        res.json(updatedApplication);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Validation Error',
                details: error.errors
            });
            return;
        }

        console.error('Error updating application:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update application'
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
