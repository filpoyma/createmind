import { Router } from 'express';
import healthRoutes from './health.routes';
import transcriptionRoutes from './transcription.routes';
import chatRoutes from './chat.routes';

const router: Router = Router();

router.use('/health', healthRoutes);
router.use('/transcriptions', transcriptionRoutes);
router.use('/chat', chatRoutes);

export default router;
