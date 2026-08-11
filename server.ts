import { serve } from '@hono/node-server';
import app from './src/app.js';
import env from './src/config/env.js';

// Application :: Bootloader
const initServer = () => {
    const port = Number(env.port) || 8080;

    // Default :: Home route
    app.get('/', (c) => {
        return c.json({
            message: 'Welcome to Dorama API...',
            timestamp: new Date().toISOString(),
        }, 200);
    });

    // Listen to the server
    serve({ fetch: app.fetch, port: port }, (info) => {
        console.log(`Server is running on: ${
            env.environment !== "production"
            ? `http://localhost:${info.port}`
            : `${env.url}`
        }`);
    });

}

// Invoke :: Application
initServer();