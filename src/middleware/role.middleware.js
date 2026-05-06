import AppError from '../utils/AppError.js';

/**
 * Middleware to restrict access to certain roles.
 * Must be used AFTER the 'protect' middleware.
 * @param {...string} roles - The allowed roles (e.g., 'admin')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user is populated by our 'protect' middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
