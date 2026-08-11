import { Redis } from '@upstash/redis';
import env from './env.js';

// Create Redis Connection
const redis = new Redis({
    url: env.redis.url,
    token: env.redis.token,
});

// Export
export default redis;