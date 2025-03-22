import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { generateTransporter } from './transporter';
import { BASE_URL, SMTP_SEND_EMAIL } from './CONSTANTS';
import { JWTPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '24h';

export class AuthService {
  static async createToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  static async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async findOrCreateUser(email: string): Promise<{ userId: number; newUser: boolean }> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (user) {
      return { userId: user.id, newUser: false };
    }

    const newUser = await prisma.user.create({
      data: { email },
      select: { id: true }
    });

    return { userId: newUser.id, newUser: true };
  }

  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    const transporter = generateTransporter();
    const verificationLink = `${BASE_URL}/api/auth/verify?token=${token}`;

    await transporter.sendMail({
      from: `"Job Extension" <${SMTP_SEND_EMAIL}>`,
      to: email,
      subject: "Verify your email",
      text: `Please verify your email by clicking on this link: ${verificationLink}`,
      html: `
        <div>
          <h2>Welcome to Job Extension!</h2>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationLink}">Verify Email</a>
        </div>
      `
    });
  }

  static async findValidToken(userId: number): Promise<string | null> {
    const token = await prisma.token.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    return token?.token || null;
  }
}
