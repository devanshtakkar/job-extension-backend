import { z, ZodError } from 'zod';

export const EmailAuthRequestSchema = z.object({
  email: z.string().email()
}).strict();

export const VerifyTokenRequestSchema = z.object({
  token: z.string()
}).strict();

export type EmailAuthRequest = z.infer<typeof EmailAuthRequestSchema>;
export type VerifyTokenRequest = z.infer<typeof VerifyTokenRequestSchema>;

export type AuthErrorResponse = {
  error: string;
  message: string | ZodError['errors'];
};

export type EmailAuthSuccessResponse = {
  message?: string;
  token?: string;
  newUser?: boolean;
};

export type VerifyTokenSuccessResponse = {
  message: string;
  token: string;
};

export type EmailAuthResponse = EmailAuthSuccessResponse | AuthErrorResponse;
export type VerifyTokenResponse = VerifyTokenSuccessResponse | AuthErrorResponse;

export interface JWTPayload {
  userId: number;
  email: string;
  verified: boolean;
  exp?: number;
}
