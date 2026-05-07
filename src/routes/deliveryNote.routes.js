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

router.post('/', createDeliveryNote);

router.get('/', getDeliveryNotes);

router.get('/:id', getDeliveryNote);

router.put('/:id', updateDeliveryNote);

router.delete('/:id', deleteDeliveryNote);

export default router;
