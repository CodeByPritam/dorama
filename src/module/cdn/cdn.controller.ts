import type { Context, Handler } from 'hono';

// Content Delivery Network Logic
const CdnController: Handler = async (c: Context) => {
    return c.json({
        message: "Hello from, content delivery network system...",
        timestamp: new Date().toISOString(),
    }, 200);
}

// Export
export default CdnController;