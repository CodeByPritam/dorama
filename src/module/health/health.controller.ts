import type { Context, Handler } from 'hono';
import { GenerateHealthReport } from '../../lib/system-metrics.js'

// Health check controller logic
const HealthCheckController: Handler = async (c: Context) => {
    try {
        const report = await GenerateHealthReport();
        const httpStatus = report.status === 'critical' ? 503 : 200;
        return c.json(report, httpStatus);
    } catch (error) {
        return c.json({ 
            status: 'critical',
            timestamp: new Date().toISOString(),
            error: 'health check failed' 
        }, 503);
    }
}

// Export
export default HealthCheckController;