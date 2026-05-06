import express from 'express';
import { 
  register, 
  validateEmail, 
  login, 
  updatePersonalData, 
  updateCompany, 
  uploadLogo, 
  getUser, 
  refreshToken, 
  logout, 
  deleteUser, 
  changePassword, 
  inviteUser 
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags: [User]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/register', register);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [User]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login success
 */
router.post('/login', login);

router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags: [User]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User data
 */
router.get('/', protect, getUser);

router.post('/logout', protect, logout);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     tags: [User]
 *     summary: Validate email with code
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Email validated
 */
router.put('/validation', protect, validateEmail);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     tags: [User]
 *     summary: Update personal data (fullName, nif)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               surname: { type: string }
 *               nif: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/register', protect, updatePersonalData);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     tags: [User]
 *     summary: Associate user with a company
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               cif: { type: string }
 *               isFreelance: { type: boolean }
 *               address: { type: object }
 *     responses:
 *       200:
 *         description: Company associated
 */
router.patch('/company', protect, updateCompany);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     tags: [User]
 *     summary: Upload company logo
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Logo uploaded
 */
router.patch('/logo', protect, upload.single('logo'), uploadLogo);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     tags: [User]
 *     summary: Delete user account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/', protect, deleteUser);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     tags: [User]
 *     summary: Change password
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.put('/password', protect, changePassword);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     tags: [User]
 *     summary: Invite a new user to the company (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       201:
 *         description: User invited
 */
router.post('/invite', protect, authorize('admin'), inviteUser);

export default router;
