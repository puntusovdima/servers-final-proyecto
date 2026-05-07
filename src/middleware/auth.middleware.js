import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';

import { env } from '../config/env.js';

const ACCESS_SECRET = env.JWT_SECRET;

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {

        const secret = ACCESS_SECRET.trim();

        const decoded = jwt.verify(token, secret);

        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        if (currentUser.deleted) {
            return next(new AppError('This account has been deactivated.', 403));
        }

        req.user = currentUser; 
        next();
    } catch (error) {
        console.error(`[Auth Middleware] JWT Verification Failed: ${error.message}`);
        return next(new AppError('Invalid token or token has expired.', 401));
    }
};
