import { config } from 'dotenv';
config();

// Application Configuration
const env = {
    url: process.env.URL,
    port: process.env.PORT,
    environment: process.env.NODE_ENV,

    // Database
    db: {
        supabase: {
            host: process.env.SUPABASE_DB_HOST,
            port: process.env.SUPABASE_DB_PORT,
            name: process.env.SUPABASE_DB_NAME,
            username: process.env.SUPABASE_DB_USERNAME,
            password: process.env.SUPABASE_DB_PASSWORD,
        },
        d1: {},
        mongodb: {},
    },

    // Object Storage
    cloudflare: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        r2: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
        },
    },

    // Redis
    redis: {
        url: process.env.REDIS_REST_URL,
        token: process.env.REDIS_REST_TOKEN,
    },

    // Sms Service
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        tokenforAuth: process.env.TWILIO_AUTH_TOKEN,
    },

    // Jwt
    jwt: {},

}

// Export
export default env;