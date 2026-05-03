import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getClientIp } from './middlewares/getClientIp.js';
import authRouter from './auth/auth.route.js';

// Create instance of Hono
const app = new Hono();
app.use('*', getClientIp);
app.use('*', cors());

// Auth Router : { for login & sign-up }
app.route('/api/v1', authRouter);

// Export
export default app;