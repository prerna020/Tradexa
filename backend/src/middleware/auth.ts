import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthedRequest extends Request {
    userId?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    // Support token from either a Bearer Authorization header or the cookie named 'token'
    const authHeader = req.headers.authorization; // optional: "Bearer <token>"
    // cookie-parser populates req.cookies — use it when available
    const cookieToken = (req as any).cookies?.token as string | undefined;
    const headerToken = authHeader?.split(' ')[1];
    const token = cookieToken || headerToken;

    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = payload.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}