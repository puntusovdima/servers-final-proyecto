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

// --- POINT 1: Register ---
export const register = async (req, res, next) => {
    try {
        // 1. Validate data coming from client using Zod
        const validatedData = registerSchema.parse(req.body);

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email: validatedData.email });
        if (existingUser) {
            // Throw conflict error
            throw new AppError('Email is already registered.', 409);
        }

        // 3. Generate random 6 digit code (100000 to 999999)
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Create the user. The password plain text will be automatically hashed
        //    by the "pre('save')" hook before it enters MongoDB.
        const newUser = await User.create({
            email: validatedData.email,
            password: validatedData.password,
            verificationCode: code
        });

        // 5. Fire global event
        notificationService.emit('user:registered', newUser.email);

        // 6. Generate Tokens
        const tokens = generateTokens(newUser._id);
        
        // 7. Store refresh token for invalidation (Point 7)
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
        // If Zod throws a validation error, we format it nicely
        if (error.name === 'ZodError') {
            return next(new AppError(error.issues[0].message, 400));
        }
        next(error);
    }
};

// --- POINT 2: Email Validation ---
export const validateEmail = async (req, res, next) => {
    try {
        // req.user.id comes from the 'protect' JWT auth middleware!
        const userId = req.user.id;
        
        // Zod validation
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
            // Decrease attempts
            user.verificationAttempts -= 1;
            await user.save();
            throw new AppError(`Invalid code. ${user.verificationAttempts} attempts remaining.`, 401);
        }

        // Success!
        user.status = 'verified';
        // (Optional) wipe the code/attempts so they can't be reused
        user.verificationCode = undefined;
        await user.save();

        notificationService.emit('user:verified', user.email);

        res.status(200).json({ status: 'success', message: 'Email validated successfully!' });
    } catch (error) {
        if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
        next(error);
    }
};

// --- POINT 3: Login ---
export const login = async (req, res, next) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        // We explicitly tell Mongoose to pull back the password for checking
        // using "+password" because we historically set it to "select: false"
        const user = await User.findOne({ email: validatedData.email }).select('+password');
        
        if (!user) {
            throw new AppError('Invalid email or password.', 401);
        }

        // Use bcrypt to compare plain text vs hashed
        const isPasswordCorrect = await bcrypt.compare(validatedData.password, user.password);

        if (!isPasswordCorrect) {
            throw new AppError('Invalid email or password.', 401);
        }

        // --- SOFT DELETE CHECK ---
        if (user.deleted) {
            throw new AppError('This account has been deactivated.', 403);
        }

        // Generate new set of tokens
        const tokens = generateTokens(user._id);

        // Update refresh token in DB
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    fullName: user.fullName, // Now we have fullName virtual
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

// --- POINT 4: Update Personal Data ---
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

// --- POINT 4: Update Company ---
export const updateCompany = async (req, res, next) => {
    try {
        const validatedData = companySchema.parse(req.body);
        const user = await User.findById(req.user.id);
        if (!user) throw new AppError('User not found.', 404);

        let company;

        if (validatedData.isFreelance) {
            // Freelancer Logic: CIF = NIF
            // Requirements: "Si es autónomo, el CIF de la compañía será su propio NIF"
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
            // Standard Company Logic
            company = await Company.findOne({ cif: validatedData.cif });

            if (company) {
                // Join existing company
                user.role = 'guest';
            } else {
                // Create new standard company
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

// --- POINT 5: Upload Logo ---
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

        // Delete OLD logo if it exists for cleanup
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

// --- POINT 6: Get User (Populated) ---
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

// --- POINT 7: Refresh & Logout ---
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: incomingToken } = req.body;
        if (!incomingToken) throw new AppError('Refresh token is required', 400);

        // 1. Verify token
        const secret = env.JWT_REFRESH_SECRET.trim();
        const decoded = jwt.verify(incomingToken, secret);

        // 2. Check if it matches what's in the DB
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== incomingToken) {
            throw new AppError('Invalid or expired refresh token', 401);
        }

        // 3. Issue new access token
        const tokens = generateTokens(user._id);

        // 4. Update the stored refresh token (Rotation)
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.status(200).json({
            status: 'success',
            data: { ...tokens }
        });
    } catch (error) {
        console.error(`[Refresh Token Error] ${error.message}`);
        // If it's an operational AppError we threw (like 401 or 400), pass it on
        if (error.isOperational) return next(error);
        // Otherwise, it was likely a JWT verification error
        next(new AppError('Invalid or expired refresh token', 401));
    }
};

export const logout = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) throw new AppError('User not found.', 404);

        // Invalidate token in DB
        user.refreshToken = undefined;
        await user.save();

        res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

// --- POINT 8: Delete User (Hard/Soft) ---
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

// --- POINT 9: Change Password ---
export const changePassword = async (req, res, next) => {
    try {
        const validatedData = changePasswordSchema.parse(req.body);

        const user = await User.findById(req.user.id).select('+password');
        if (!user) throw new AppError('User not found.', 404);

        // Verify old password
        const isCorrect = await bcrypt.compare(validatedData.oldPassword, user.password);
        if (!isCorrect) throw new AppError('Current password is incorrect', 401);

        // Update password (triggering .pre('save') hashing)
        user.password = validatedData.newPassword;
        await user.save();

        res.status(200).json({ status: 'success', message: 'Password updated successfully' });
    } catch (error) {
        if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
        next(error);
    }
};

// --- POINT 10: Invite Peers (Admin Only) ---
export const inviteUser = async (req, res, next) => {
    try {
        const validatedData = inviteSchema.parse(req.body);

        // Admin's own data to link company
        const admin = await User.findById(req.user.id);
        if (!admin || !admin.company) throw new AppError('Admin must have a company associated to invite.', 400);

        const existing = await User.findOne({ email: validatedData.email });
        if (existing) throw new AppError('User already exists in system.', 409);

        // Generate random temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');

        // Create Guest User linked to same company
        const invitedUser = await User.create({
            email: validatedData.email,
            password: tempPassword,
            company: admin.company,
            role: 'guest',
            status: 'pending' 
        });

        notificationService.emit('user:invited', invitedUser.email);
        console.log(`[Phase 4] Invited user ${invitedUser.email} with temp password: ${tempPassword}`);

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
