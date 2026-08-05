import { Router } from 'express';
import healthRoutes from './health.routes';
import transcriptionRoutes from './transcription.routes';

const router: Router = Router();

router.use('/health', healthRoutes);
router.use('/transcriptions', transcriptionRoutes);

export default router;
