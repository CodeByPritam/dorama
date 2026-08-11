import postgres from 'postgres';
import env from  './env.js';

// Setup :: PostgreSQL Connection URL
const pgql = env.db.supabase;
const pgqlConnectionUrl = `postgresql://${pgql.username}:${pgql.password}@${pgql.host}:${pgql.port}/${pgql.name}`;

// Create Connection & Start Handshake
const db = postgres(pgqlConnectionUrl, {
    max: 15,             // Connection pool
    idle_timeout: 20,    // Idle request timeout 20s
    connect_timeout: 10, // Connection timeout 10s
    max_lifetime: 1800,  // Recycle connections every 30min
    prepare: false,      // required for Supabase pgBouncer
});

// Export
export default db;