import { Router } from 'express';
import { 
  createProject, 
  getProjects, 
  getProject, 
  updateProject, 
  deleteProject 
} from '../controllers/project.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/project:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client, name, projectCode, email, address]
 *             properties:
 *               client: { type: string, example: '65f8b3a2c9d1e20012345678' }
 *               name: { type: string, example: 'Reforma Local Centro' }
 *               projectCode: { type: string, example: 'PRJ-2024-001' }
 *               email: { type: string, format: 'email', example: 'obras@centro.com' }
 *               address:
 *                 type: object
 *                 properties:
 *                   street: { type: string, example: 'Gran Vía' }
 *                   number: { type: string, example: '1' }
 *                   postal: { type: string, example: '28013' }
 *                   city: { type: string, example: 'Madrid' }
 *                   province: { type: string, example: 'Madrid' }
 *               notes: { type: string, example: 'Urgente' }
 *     responses:
 *       201:
 *         description: Project created
 *       404:
 *         description: Client not found
 */
router.post('/', createProject);

/**
 * @swagger
 * /api/project:
 *   get:
 *     tags: [Projects]
 *     summary: List all projects for your company
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema: { type: string }
 *         description: Filter by client ID
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', getProjects);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project data
 */
router.get('/:id', getProject);

/**
 * @swagger
 * /api/project/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Project updated
 */
router.put('/:id', updateProject);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete or archive a project
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: Project deleted/archived
 */
router.delete('/:id', deleteProject);

export default router;
