import { Router } from 'express';
import { 
  createProject, 
  getProjects, 
  getProject, 
  updateProject, 
  deleteProject,
  getArchivedProjects,
  restoreProject 
} from '../controllers/project.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/', createProject);

router.get('/', getProjects);

router.get('/archived', getArchivedProjects);

router.get('/:id', getProject);

router.put('/:id', updateProject);

router.delete('/:id', deleteProject);

router.patch('/:id/restore', restoreProject);

export default router;
