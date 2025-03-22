import express, { Request, Response } from 'express';
import { ZodError } from 'zod';
import { 
    EmailAuthRequestSchema, 
    VerifyTokenRequestSchema, 
    AuthErrorResponse,
    EmailAuthSuccessResponse,
    VerifyTokenSuccessResponse
} from '../types/auth';
import { AuthService } from '../lib/auth.service';
import prisma from '../lib/prisma';

const router = express.Router();

router.post('/email', async (req, res) => {
    try {
        const { email } = EmailAuthRequestSchema.parse(req.body);
        
        // Find or create user
        const { userId, newUser } = await AuthService.findOrCreateUser(email);
        
        // Check for existing valid token
        const existingToken = await AuthService.findValidToken(userId);
        if (existingToken) {
            const response: EmailAuthSuccessResponse = { token: existingToken };
            res.status(200).json(response);
            return;
        }
        
        // Create new token
        const token = await AuthService.createToken({
            userId,
            email,
            verified: false
        });
        
        // Store token in database
        await prisma.token.create({
            data: {
                token,
                userId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            }
        });
        
        // Send verification email
        await AuthService.sendVerificationEmail(email, token);
        
        const response: EmailAuthSuccessResponse = {
            message: 'Verification email sent',
            newUser
        };
        res.json(response);
    } catch (error) {
        if (error instanceof ZodError) {
            const response: AuthErrorResponse = {
                error: 'Validation Error',
                message: error.errors
            };
            res.status(400).json(response);
            return;
        }
        
        console.error('Error in email auth:', error);
        const response: AuthErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to process authentication'
        };
        res.status(500).json(response);
    }
});

router.get('/verify', async (req: Request, res: Response) => {
    try {
        const { token } = VerifyTokenRequestSchema.parse(req.query);
        
        // Verify the token
        const decoded = await AuthService.verifyToken(token);
        
        // Find and update token to verified status
        const tokenRecord = await prisma.token.findFirst({
            where: {
                token: token
            }
        });

        if (!tokenRecord) {
            const response: AuthErrorResponse = {
                error: 'Not Found',
                message: 'Token not found in database'
            };
            res.status(404).json(response);
            return;
        }

        await prisma.token.update({
            where: { id: tokenRecord.id },
            data: {
                verified: true
            }
        });
        
        const response: VerifyTokenSuccessResponse = {
            message: 'Email verified successfully',
            token
        };
        res.json(response);
    } catch (error) {
        if (error instanceof ZodError) {
            const response: AuthErrorResponse = {
                error: 'Validation Error',
                message: error.errors
            };
            res.status(400).json(response);
            return;
        }
        
        console.error('Error in verification:', error);
        const response: AuthErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to verify email'
        };
        res.status(500).json(response);
    }
});

export default router;
