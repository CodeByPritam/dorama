import type { Context, Handler } from 'hono';

// Auth Controller Logic
const AuthController: Handler = async (c: Context) => {
    return c.json({
        message: 'Hello, from auth controller module...',
        timestamp: new Date().toISOString(), 
    }, 200);
}

// Export
export default AuthController;