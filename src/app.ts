import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GeoIP } from './middlewares/geo-ip.js';

// Create :: Instance of Hono
const app = new Hono();

// Mount :: toApplication ({ GeoIP, Cors })
app.use('*', GeoIP);
app.use('*', cors({ origin: 'http://localhost:8080' }));

// Export :: Application
export default app;