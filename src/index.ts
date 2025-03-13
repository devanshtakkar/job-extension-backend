import express, { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import cors from 'cors';
import dotenv from 'dotenv';
import { QuestionsArraySchema } from './types/question';
import { processQuestions } from './lib/gemini.service';

dotenv.config();

const app = express();

app.use(cors());
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Process questions endpoint
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
            message: error instanceof Error ? error.message : 'Unknown error occurred'
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

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;
