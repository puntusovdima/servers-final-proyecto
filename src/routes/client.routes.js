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

router.post('/', createClient);

router.get('/', getClients);

router.get('/archived', getArchivedClients);

router.get('/:id', getClient);

router.put('/:id', updateClient);

router.delete('/:id', deleteClient);

router.patch('/:id/restore', restoreClient);

export default router;
