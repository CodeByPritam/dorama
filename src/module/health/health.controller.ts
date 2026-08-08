import type { Context, Handler } from 'hono';

// Health check controller logic
const HealthCheckController: Handler = async (c: Context) => {
    return c.json({
        message: "Hello from health check controller!"
    }, 200);
}

// Export
export default HealthCheckController;