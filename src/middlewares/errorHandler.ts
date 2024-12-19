import { Request, Response, NextFunction } from 'express';

class AppError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    let { statusCode, message } = err;

    if (!statusCode) statusCode = 500;
    if (!message) message = 'A problem has occurred.';

    console.error(err);

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });
};

export default errorHandler;