import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';

import { env } from '../config/env.js';

const ACCESS_SECRET = env.JWT_SECRET;

export const protect = async (req, res, next) => {
    let token;

    // Check if the auth header exists and starts with Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        // Trim secret to avoid any hidden newline/space issues from .env
        const secret = ACCESS_SECRET.trim();
        
        // 1. Verification step
        const decoded = jwt.verify(token, secret);
        
        // 2. Fetch the current user from the database (Points 7 & 10 need this)
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // 3. Check if user is soft-deleted (another safety layer)
        if (currentUser.deleted) {
            return next(new AppError('This account has been deactivated.', 403));
        }

        // 4. Attach the full user record to the request
        req.user = currentUser; 
        next();
    } catch (error) {
        console.error(`[Auth Middleware] JWT Verification Failed: ${error.message}`);
        return next(new AppError('Invalid token or token has expired.', 401));
    }
};
