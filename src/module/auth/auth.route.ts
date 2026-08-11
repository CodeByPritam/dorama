import { Hono } from 'hono';
import AuthController from './auth.controller.js';

// Create :: A router instance
const router = new Hono();
const AuthRouter = router.get('/auth/:action', AuthController);

// Export
export default AuthRouter;