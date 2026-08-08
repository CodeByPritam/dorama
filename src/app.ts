import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Create :: Instance of Hono
const app = new Hono();

// Export :: Application
export default app;