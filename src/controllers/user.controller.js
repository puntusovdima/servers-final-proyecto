import User from '../models/User.js';
import Company from '../models/Company.js';
import AppError from '../utils/AppError.js';
import notificationService from '../services/notification.service.js';
import { generateTokens } from '../utils/jwt.js';
import { registerSchema, validationSchema, loginSchema, changePasswordSchema, inviteSchema } from '../validators/user.validator.js';
import { personalDataSchema, companySchema } from '../validators/company.validator.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const register = async (req, res, next) => {
    try {

        const validatedData = registerSchema.parse(req.body);

        const existingUser = await User.findOne({ email: validatedData.email });
        if (existingUser) {

            throw new AppError('Email is already registered.', 409);
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = await User.create({
            email: validatedData.email,
            password: validatedData.password,
            verificationCode: code
        });

        notificationService.emit('user:registered', { email: newUser.email, code: newUser.verificationCode });

        const tokens = generateTokens(newUser._id);

        newUser.refreshToken = tokens.refreshToken;
        await newUser.save();

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    email: newUser.email,
                    role: newUser.role,
                    status: newUser.status,
                    _id: newUser._id
                },
                ...tokens
            }
        });
    } catch (error) {

        if (error.name === 'ZodError') {
            return next(new AppError(error.issues[0].message, 400));
        }
        next(error);
    }
};

export const validateEmail = async (req, res, next) => {
    try {

        const userId = req.user.id;

        const validatedData = validationSchema.parse(req.body);

        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found.', 404);
        }

        if (user.status === 'verified') {
            throw new AppError('User is already verified.', 400);
        }

        if (user.verificationAttempts <= 0) {
            throw new AppError('Too many failed attempts. Account locked.', 429);
        }

        if (user.verificationCode !== validatedData.code) {

            user.verificationAttempts -= 1;
            await user.save();
            throw new AppError(`Invalid code. ${user.verificationAttempts} attempts remaining.`, 401);
        }

        user.status = 'verified';

        user.verificationCode = undefined;
        await user.save();

        notificationService.emit('user:verified', user.email);

        res.status(200).json({ status: 'success', message: 'Email validated successfully!' });
    } catch (error) {
        if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        const user = await User.findOne({ email: validatedData.email }).select('+password');
        
        if (!user) {
            throw new AppError('Invalid email or password.', 401);
        }

        const isPasswordCorrect = await bcrypt.compare(validatedData.password, user.password);

        if (!isPasswordCorrect) {
            throw new AppError('Invalid email or password.', 401);
        }

        if (user.deleted) {
            throw new AppError('This account has been deactivated.', 403);
        }

        const tokens = generateTokens(user._id);

        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    fullName: user.fullName,
                    _id: user._id
                },
                ...tokens
            }
        });
    } catch (error) {
        if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
        next(error);
    }
};

export const updatePersonalData = async (req, res, next) => {
    try {
        const validatedData = personalDataSchema.parse(req.body);

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { ...validatedData },
            { returnDocument: 'after', runValidators: true }
        );

        if (!user) throw new AppError('User not found.', 404);

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
        next(error);
    }
};

export const updateCompany = async (req, res, next) => {
    try {
        const validatedData = companySchema.parse(req.body);
        const user = await User.findById(req.user.id);
        if (!user) throw new AppError('User not found.', 404);

        let company;

        if (validatedData.isFreelance) {

            company = await Company.findOne({ cif: user.nif });
            
            if (company) {
                company.name = validatedData.name;
                company.address = validatedData.address;
                company.isFreelance = true;
                await company.save();
            } else {
                company = await Company.create({
                    owner: user._id,
                    name: validatedData.name,
                    cif: user.nif,
                    address: validatedData.address,
                    isFreelance: true
                });
            }
            user.role = 'admin';
        } else {

            company = await Company.findOne({ cif: validatedData.cif });

            if (company) {

                user.role = 'guest';
            } else {

                company = await Company.create({
                    owner: user._id,
                    name: validatedData.name,
                    cif: validatedData.cif,
                    address: validatedData.address,
                    isFreelance: false
                });
                user.role = 'admin';
            }
        }

        user.company = company._id;
        await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                user,
                company
            }
        });
    } catch (error) {
        if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
        next(error);
    }
};

export const uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) throw new AppError('No logo file uploaded.', 400);

        const user = await User.findById(req.user.id);
        if (!user || !user.company) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            throw new AppError('Company not associated with user.', 400);
        }

        const company = await Company.findById(user.company);
        if (!company) throw new AppError('Company not found.', 404);

        if (company.logo) {
            const oldPath = company.logo.split('/').pop();
            const fullOldPath = `uploads/${oldPath}`;
            if (fs.existsSync(fullOldPath)) {
                fs.unlinkSync(fullOldPath);
            }
        }

        company.logo = `/uploads/${req.file.filename}`;
        await company.save();

        res.status(200).json({
            status: 'success',
            data: { company }
        });
    } catch (error) {
        next(error);
    }
};

export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('company');
        if (!user) throw new AppError('User not found.', 404);

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: incomingToken } = req.body;
        if (!incomingToken) throw new AppError('Refresh token is required', 400);

        const secret = env.JWT_REFRESH_SECRET.trim();
        const decoded = jwt.verify(incomingToken, secret);

        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== incomingToken) {
            throw new AppError('Invalid or expired refresh token', 401);
        }

        const tokens = generateTokens(user._id);

        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.status(200).json({
            status: 'success',
            data: { ...tokens }
        });
    } catch (error) {
        console.error(`[Refresh Token Error] ${error.message}`);

        if (error.isOperational) return next(error);

        next(new AppError('Invalid or expired refresh token', 401));
    }
};

export const logout = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) throw new AppError('User not found.', 404);

        user.refreshToken = undefined;
        await user.save();

        res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const isSoft = req.query.soft === 'true';

        if (isSoft) {
            const user = await User.findByIdAndUpdate(req.user.id, { deleted: true }, { new: true });
            if (!user) throw new AppError('User not found.', 404);
        } else {
            await User.findByIdAndDelete(req.user.id);
        }

        notificationService.emit('user:deleted', req.user.id);

        res.status(200).json({ status: 'success', message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const validatedData = changePasswordSchema.parse(req.body);

        const user = await User.findById(req.user.id).select('+password');
        if (!user) throw new AppError('User not found.', 404);

        const isCorrect = await bcrypt.compare(validatedData.oldPassword, user.password);
        if (!isCorrect) throw new AppError('Current password is incorrect', 401);

        user.password = validatedData.newPassword;
        await user.save();

        res.status(200).json({ status: 'success', message: 'Password updated successfully' });
    } catch (error) {
        if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
        next(error);
    }
};

export const inviteUser = async (req, res, next) => {
    try {
        const validatedData = inviteSchema.parse(req.body);

        const admin = await User.findById(req.user.id);
        if (!admin || !admin.company) throw new AppError('Admin must have a company associated to invite.', 400);

        const existing = await User.findOne({ email: validatedData.email });
        if (existing) throw new AppError('User already exists in system.', 409);

        const tempPassword = crypto.randomBytes(8).toString('hex');

        const invitedUser = await User.create({
            email: validatedData.email,
            password: tempPassword,
            company: admin.company,
            role: 'guest',
            status: 'pending' 
        });

        notificationService.emit('user:invited', invitedUser.email);

        res.status(201).json({
            status: 'success',
            data: { 
                email: invitedUser.email,
                role: invitedUser.role,
                company: invitedUser.company
            }
        });
    } catch (error) {
        if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
        next(error);
    }
};
