import { serve } from '@hono/node-server';
import app from './src/app.js';

// Application Bootstrap
const initServer = () => {
    const port = 8080;

    // Setup root directory
    app.get('/', (c) => {
        return c.json({
            message: 'Hello, from api root directory!',
        }, 200);
    });

    // Setup health status
    app.get('/health', (c) => {
        return c.json({
            message: 'Application health is ok!',
        }, 200);
    });

    // Listen On
    serve({
        fetch: app.fetch,
        port: port,
    }, (info) => {
        console.log(`Server is spinning up on port: ${info.port}`);
    });

}

// Invoke
initServer();