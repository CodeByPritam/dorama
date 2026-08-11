import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GeoIP } from './middlewares/geo-ip.js';
import HealthCheckRouter from './module/health/health.route.js';
import AuthRouter from './module/auth/auth.route.js';
import CdnRouter from './module/cdn/cdn.route.js';

// Create :: Instance of Hono
const app = new Hono();

// Mount :: toApplication ({ GeoIP, Cors })
app.use('*', GeoIP);
app.use('*', cors({ origin: 'http://localhost:8080' }));

// Mount :: Routes
app.route('/api/v1', HealthCheckRouter);
app.route('/api/v1', AuthRouter);
app.route('/cdn/v1', CdnRouter);

// Export :: Application
export default app;