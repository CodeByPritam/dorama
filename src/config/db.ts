import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import _appConfig from './config.js';

// Prepare URL
const x = _appConfig.db.supabase;
const dbUrl = `postgresql://${x.username}:${x.password}@${x.host}:${x.port}/${x.name}`;

// Establish handshake
const dbClient = postgres(dbUrl, {
    max: 20,             // Max connection pool
    idle_timeout: 20,    // Close idle connections after 20s
    connect_timeout: 10, // Fail fast if DB unreachable
    max_lifetime: 1800,  // Recycle connections every 30min
    prepare: false,      // required for Supabase pgBouncer
});

// Export
export const db = drizzle(dbClient);