"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    if (!statusCode)
        statusCode = 500;
    if (!message)
        message = 'A problem has occurred.';
    console.error(err);
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });
};
exports.default = errorHandler;
