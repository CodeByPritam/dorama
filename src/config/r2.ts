import { S3Client } from '@aws-sdk/client-s3';
import _appConfig from './config.js';

// Establish handshake
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${_appConfig.cf.accountID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: _appConfig.cf.r2AccessKeyID as string,
        secretAccessKey: _appConfig.cf.r2SecretAccessKey as string,
    },
    forcePathStyle: true,
});

// Set constant
const r2BucketName = _appConfig.cf.r2BucketName;
const r2PublicUrl = _appConfig.cf.r2PublicUrl;

// Export
export { r2Client, r2BucketName, r2PublicUrl };