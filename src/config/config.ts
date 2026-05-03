import { config } from 'dotenv';
config();

// Setup Application Config
const _appConfig = {
    port: process.env.PORT,
    debug: process.env.debug,

    // DB 
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

    // Cloudflare R2
    cf: {
        accountID: process.env.CLOUDFLARE_ACCOUNT_ID,
        r2AccessKeyID: process.env.R2_ACCESS_KEY_ID,
        r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        r2VideoBucketName: process.env.R2_VIDEO_BUCKET_NAME,
        r2PublicUrl: process.env.R2_PUBLIC_URL,
    },

    // Redis
    redis: {
        url: process.env.REDIS_REST_URL,
        token: process.env.REDIS_REST_TOKEN,
    },

    // Twilio
    twilio: {
        accountSID: process.env.TWILIO_ACCOUNT_SID,
        tokenforAuth: process.env.TWILIO_AUTH_TOKEN,
    },

    // Jsonwebtoken
    jwt: {
        secretKey: process.env.JWT_SECRET_KEY,
        expiresIn: process.env.JWT_EXPIRES_IN,
        refreshSecretKey: process.env.JWT_REFRESH_SECRET_KEY,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },

}

// Export
export default Object.freeze(_appConfig);