import { Hono } from 'hono';
import authController from './auth.controller.js';

// Create router instance
const router = new Hono();
const authRouter = router.post('/auth/:who/:action', authController);

// Export
export default authRouter;