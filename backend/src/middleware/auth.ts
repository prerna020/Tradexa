import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthedRequest extends Request {
    userId?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization; // expects "Bearer <token>"
    const token = authHeader?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = payload.userId; 
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}