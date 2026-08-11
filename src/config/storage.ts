import { S3Client } from '@aws-sdk/client-s3';
import env from './env.js';

// Get Bucket Name, Public Url & Create R2 Client
const r2BucketName = env.cloudflare.r2.bucketName;
const r2PublicUrl = env.cloudflare.r2.publicUrl;
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${(env as any).cloudflare.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: env.cloudflare.r2.accessKeyId as string,
        secretAccessKey: env.cloudflare.r2.secretAccessKey as string,
    },
    forcePathStyle: true,
});

// Export
export { r2, r2BucketName, r2PublicUrl };