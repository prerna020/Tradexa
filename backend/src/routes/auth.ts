import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        

        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                cashBalance: 100000,
            },
        });
        const token = jwt.sign(
            { userId: user.id }, 
            JWT_SECRET!, 
            { expiresIn: '7d' }
        );
        res.cookie('token', token, COOKIE_OPTIONS);

        return res.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                cashBalance: user.cashBalance,
            },
        });
    } catch (err: any) {
        console.error('Signup error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET!, { expiresIn: '7d' });
        res.cookie('token', token, COOKIE_OPTIONS);

        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                cashBalance: user.cashBalance,
            },
        });
    } catch (err: any) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('token', COOKIE_OPTIONS);
    return res.json({ success: true, message: 'Logged out successfully' });
});

// called by AuthContext on every page load to check if user is logged in
// requireAuth validates the JWT cookie and attaches req.userId
// if the cookie is missing or invalid, requireAuth returns 401 and this handler never runs
router.get('/me', requireAuth, async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, cashBalance: true }, // never send the password
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({ id: user.id, email: user.email, balance: String(user.cashBalance) });
    } catch (err) {
        console.error('GET /auth/me error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;