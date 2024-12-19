import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface DecodedToken {
    id: number;
    username: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: DecodedToken;
        }
    }
}

async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.header('x-auth-token');

    if (!token) {
        res.status(401).send('User is not allowed to see this page');
        return;
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
        req.user = decodedToken;
        next();
    } catch (err) {
        res.status(400).send("Broken token");
    }
}

export default auth;
