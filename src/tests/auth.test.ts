import request from 'supertest';
import app from '../index';
import { AuthService } from '../lib/auth.service';
import prisma from '../lib/prisma';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/auth.service');
vi.mock('../lib/prisma');
vi.mock('../lib/transporter');

describe('Auth Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/auth/email', () => {
        it('should return existing token if valid token exists', async () => {
            const mockEmail = 'test@example.com';
            const mockUserId = 1;
            const mockToken = 'existing-valid-token';

            vi.mocked(AuthService.findOrCreateUser).mockResolvedValue({
                userId: mockUserId,
                newUser: false
            });

            vi.mocked(AuthService.findValidToken).mockResolvedValue(mockToken);

            const response = await request(app)
                .post('/api/auth/email')
                .send({ email: mockEmail });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                token: mockToken
            });
        });

        it('should send verification email for new users', async () => {
            const mockEmail = 'newuser@example.com';
            const mockUserId = 2;
            const mockToken = 'new-token';

            vi.mocked(AuthService.findOrCreateUser).mockResolvedValue({
                userId: mockUserId,
                newUser: true
            });

            vi.mocked(AuthService.findValidToken).mockResolvedValue(null);
            vi.mocked(AuthService.createToken).mockResolvedValue(mockToken);
            vi.mocked(prisma.token.create).mockResolvedValue({ 
                id: 1,
                token: mockToken,
                userId: mockUserId,
                expiresAt: new Date(),
                createdAt: new Date(),
                verified: false
            });

            const response = await request(app)
                .post('/api/auth/email')
                .send({ email: mockEmail });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Verification email sent',
                newUser: true
            });
            expect(AuthService.sendVerificationEmail).toHaveBeenCalledWith(mockEmail, mockToken);
        });

        it('should validate email format', async () => {
            const response = await request(app)
                .post('/api/auth/email')
                .send({ email: 'invalid-email' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation Error');
        });
    });

    describe('GET /api/auth/verify', () => {
        it('should verify token and return new token', async () => {
            const mockToken = 'test-token';
            const mockDecodedToken = {
                userId: 1,
                email: 'test@example.com',
                verified: false
            };
            const mockNewToken = 'new-verified-token';

            vi.mocked(AuthService.verifyToken).mockResolvedValue(mockDecodedToken);
            vi.mocked(AuthService.createToken).mockResolvedValue(mockNewToken);
            vi.mocked(prisma.token.upsert).mockResolvedValue({
                id: 1,
                token: mockNewToken,
                userId: mockDecodedToken.userId,
                expiresAt: new Date(),
                createdAt: new Date(),
                verified: true
            });

            const response = await request(app)
                .get('/api/auth/verify')
                .query({ token: mockToken });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Email verified successfully',
                token: mockNewToken
            });
        });

        it('should handle invalid tokens', async () => {
            vi.mocked(AuthService.verifyToken).mockRejectedValue(new Error('Invalid token'));

            const response = await request(app)
                .get('/api/auth/verify')
                .query({ token: 'invalid-token' });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Internal Server Error');
        });
    });
});
