import { Router } from 'express';
import { 
  createClient, 
  updateClient, 
  getClients, 
  getClient, 
  deleteClient, 
  getArchivedClients, 
  restoreClient 
} from '../controllers/client.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/client:
 *   post:
 *     tags: [Clients]
 *     summary: Create a new client
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Client created successfully
 *       409:
 *         description: CIF already exists in company
 */
router.post('/', createClient);

/**
 * @swagger
 * /api/client:
 *   get:
 *     tags: [Clients]
 *     summary: List all clients (paginated)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: 'createdAt' }
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get('/', getClients);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     tags: [Clients]
 *     summary: List archived clients
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of archived clients
 */
router.get('/archived', getArchivedClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Get a client by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client data
 *       404:
 *         description: Client not found
 */
router.get('/:id', getClient);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     tags: [Clients]
 *     summary: Update a client
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
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client updated
 *       404:
 *         description: Client not found
 */
router.put('/:id', updateClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     tags: [Clients]
 *     summary: Delete or archive a client
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
 *         description: Client deleted/archived
 *       404:
 *         description: Client not found
 */
router.delete('/:id', deleteClient);

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     tags: [Clients]
 *     summary: Restore an archived client
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client restored
 *       404:
 *         description: Client not found
 */
router.patch('/:id/restore', restoreClient);

export default router;
