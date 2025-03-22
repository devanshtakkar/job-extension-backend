import { vi } from 'vitest';
import { JWTPayload } from '../../types/auth';

export const AuthService = {
    createToken: vi.fn(async (payload: Omit<JWTPayload, 'exp'>): Promise<string> => {
        return 'mocked-token';
    }),

    verifyToken: vi.fn(async (token: string): Promise<JWTPayload> => {
        return {
            userId: 1,
            email: 'test@example.com',
            verified: false
        };
    }),

    findOrCreateUser: vi.fn(async (email: string): Promise<{ userId: number; newUser: boolean }> => {
        return {
            userId: 1,
            newUser: false
        };
    }),

    findValidToken: vi.fn(async (userId: number): Promise<string | null> => {
        return null;
    }),

    sendVerificationEmail: vi.fn(async (email: string, token: string): Promise<void> => {
        return Promise.resolve();
    })
};
