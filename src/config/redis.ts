import { Redis } from '@upstash/redis';
import _appConfig from './config.js';

// Establish handshake
const redis = new Redis({
    url: _appConfig.redis.url,
    token: _appConfig.redis.token,
});

// Export
export default redis;