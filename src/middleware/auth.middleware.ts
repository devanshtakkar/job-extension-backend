import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../lib/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        verified: boolean;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await AuthService.verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      verified: decoded.verified
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

export const requireVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.verified) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Email verification required'
    });
  }
  next();
};
