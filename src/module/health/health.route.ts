import { Hono } from 'hono';
import HealthCheckController from './health.controller.js';

// Create :: A router instance
const router = new Hono();
const HealthCheckRouter = router.get('/health-check', HealthCheckController);

// Export
export default HealthCheckRouter;