import express from 'express';
import { register, validateEmail, login, updatePersonalData, updateCompany, uploadLogo, getUser, refreshToken, logout, deleteUser, changePassword, inviteUser } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (require JWT)
router.get('/', protect, getUser);
router.post('/logout', protect, logout);
router.put('/validation', protect, validateEmail);
router.put('/register', protect, updatePersonalData);
router.patch('/company', protect, updateCompany);
router.patch('/logo', protect, upload.single('logo'), uploadLogo);
router.delete('/', protect, deleteUser);
router.put('/password', protect, changePassword);

// Admin-only routes
router.post('/invite', protect, authorize('admin'), inviteUser);

export default router;
