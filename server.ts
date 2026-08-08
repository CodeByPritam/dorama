import { serve } from '@hono/node-server';
import app from './src/app.js';

// Application :: Bootloader
const initServer = () => {
    const environment = 'development';
    const appurl = `https://dorama.dev`;
    const port = 8080;

    // Default :: Home route
    app.get('/', (c) => {
        return c.json({
            message: 'Welcome to Dorama API',
            timestamp: new Date().toISOString(),
        }, 200);
    });

    // Listen to the server
    serve({ fetch: app.fetch, port: port }, (info) => {
        console.log(`Server is running on: ${
            environment === "development"
            ? `http://localhost:${info.port}`
            : `${appurl}`
        }`);
    });

}

// Invoke :: Application
initServer();