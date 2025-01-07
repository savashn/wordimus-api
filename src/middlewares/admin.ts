import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { DecodedToken } from '../types/interfaces';

export default async function admin(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.header('x-auth-token');

    if (!token) {
        return next();
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
        req.user = decodedToken;
    } catch (error) {
        console.error('JWT Error:', (error as Error).message);
    }

    next();
}