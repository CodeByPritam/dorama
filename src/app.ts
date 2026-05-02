import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Create instance of Hono
const app = new Hono();
app.use('*', cors());

// Export
export default app;