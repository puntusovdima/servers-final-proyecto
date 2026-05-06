import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, env.JWT_SECRET.trim(), {
        expiresIn: '15m'
    });

    const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET.trim(), {
        expiresIn: '7d'
    });

    return { accessToken, refreshToken };
};
