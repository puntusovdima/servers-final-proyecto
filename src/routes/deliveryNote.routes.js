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

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags: [DeliveryNotes]
 *     summary: Sign a delivery note and generate its PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the delivery note
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signature]
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Signature image file (PNG/JPG)
 *     responses:
 *       200:
 *         description: Delivery note signed and PDF generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Delivery note signed and PDF generated
 *                 data:
 *                   type: object
 *                   properties:
 *                     deliveryNote:
 *                       $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Signature image is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Delivery note not found or already signed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/sign', upload.single('signature'), signDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Get the PDF of a signed delivery note
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the delivery note
 *     responses:
 *       200:
 *         description: Redirects to the PDF URL or streams the file
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: PDF not found for this delivery note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/pdf/:id', getDeliveryNotePDF);

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     tags: [DeliveryNotes]
 *     summary: Create a new delivery note
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [project, client, format, material, description, workDate]
 *                 properties:
 *                   project:
 *                     type: string
 *                     example: '65f8b3a2c9d1e20012345678'
 *                   client:
 *                     type: string
 *                     example: '65f8b3a2c9d1e20012345678'
 *                   format:
 *                     type: string
 *                     enum: [material]
 *                   material:
 *                     type: string
 *                     example: 'Cemento Portland 50kg'
 *                   description:
 *                     type: string
 *                     example: 'Suministro de material'
 *                   workDate:
 *                     type: string
 *                     format: date
 *                     example: '2024-03-20'
 *               - type: object
 *                 required: [project, client, format, hours, description, workDate]
 *                 properties:
 *                   project:
 *                     type: string
 *                     example: '65f8b3a2c9d1e20012345678'
 *                   client:
 *                     type: string
 *                     example: '65f8b3a2c9d1e20012345678'
 *                   format:
 *                     type: string
 *                     enum: [hours]
 *                   hours:
 *                     type: number
 *                     example: 8
 *                   workers:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ['65f8b3a2c9d1e20012345678']
 *                   description:
 *                     type: string
 *                     example: 'Jornada de trabajo'
 *                   workDate:
 *                     type: string
 *                     format: date
 *                     example: '2024-03-20'
 *     responses:
 *       201:
 *         description: Delivery note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     deliveryNote:
 *                       $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Validation error (e.g. missing material or hours for the selected format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found or not linked to this client/company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: List delivery notes for the authenticated company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *         description: Filter by delivery note format
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *         description: Filter by signed status
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by work date from (inclusive)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by work date to (inclusive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: '-workDate'
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: Paginated list of delivery notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     deliveryNotes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeliveryNote'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         currentPage:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Get a single delivery note by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the delivery note
 *     responses:
 *       200:
 *         description: Delivery note found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     deliveryNote:
 *                       $ref: '#/components/schemas/DeliveryNote'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Delivery note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getDeliveryNote);

router.put('/:id', updateDeliveryNote);

router.delete('/:id', deleteDeliveryNote);

export default router;
