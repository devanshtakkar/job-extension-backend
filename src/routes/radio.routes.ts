import { Router } from 'express';
import { answerRadioQuestion } from '../lib/gemini.service';
import { JobDetails } from '../types/cover-letter';

const router = Router();

/**
 * POST /api/radio/answer
 * Answers radio button questions using Gemini AI
 */
router.post('/answer', async (req, res) => {
    try {
        const { jobDetails, html } = req.body;

        // Validate request body
        if (!jobDetails || !html) {
            res.status(400).json({
                error: 'Missing required fields: jobDetails and html are required'
            });
            return;
        }

        if (typeof html !== 'string') {
            res.status(400).json({
                error: 'HTML must be a string'
            });
            return;
        }

        // Validate jobDetails structure
        if (!isValidJobDetails(jobDetails)) {
            res.status(400).json({
                error: 'Invalid job details format'
            });
            return;
        }

        const answer = await answerRadioQuestion(jobDetails, html);
        res.json({ answer });
    } catch (error) {
        console.error('Radio question answering error:', error);
        res.status(500).json({
            error: 'Failed to process radio questions'
        });
    }
});

// Type guard for JobDetails
function isValidJobDetails(details: any): details is JobDetails {
    return (
        typeof details === 'object' &&
        details !== null &&
        typeof details.jobTitle === 'string' &&
        typeof details.companyName === 'string' &&
        typeof details.desc === 'string'
    );
}

export default router;
