import { Router } from 'express';
import { 
  createDeliveryNote, 
  getDeliveryNotes, 
  getDeliveryNote, 
  updateDeliveryNote, 
  deleteDeliveryNote,
  signDeliveryNote,
  getDeliveryNotePDF
} from '../controllers/deliveryNote.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.patch('/:id/sign', upload.single('signature'), signDeliveryNote);
router.get('/pdf/:id', getDeliveryNotePDF);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Get delivery note PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF file or redirect to cloud storage
 */

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags: [DeliveryNotes]
 *     summary: Sign a delivery note and generate PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Delivery note signed and PDF generated
 */

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     tags: [Delivery Notes]
 *     summary: Create a new delivery note
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project, client, format, description, workDate]
 *             properties:
 *               project: { type: string, example: '65f8b3a2c9d1e20012345678' }
 *               client: { type: string, example: '65f8b3a2c9d1e20012345678' }
 *               format: { type: string, enum: [material, hours], example: 'hours' }
 *               hours: { type: number, example: 8 }
 *               material: { type: string, example: 'Gemento 50kg' }
 *               description: { type: string, example: 'Jornada completa cimentación' }
 *               workDate: { type: string, format: date, example: '2024-03-20' }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     tags: [Delivery Notes]
 *     summary: List all delivery notes
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: clientId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of delivery notes
 */
router.get('/', getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     tags: [Delivery Notes]
 *     summary: Get delivery note by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery note data
 */
router.get('/:id', getDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   put:
 *     tags: [Delivery Notes]
 *     summary: Update a delivery note (only if not signed)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', updateDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     tags: [Delivery Notes]
 *     summary: Archive a delivery note
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Archived
 */
router.delete('/:id', deleteDeliveryNote);

export default router;
