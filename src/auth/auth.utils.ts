import { r2Client, r2BucketName, r2PublicUrl } from '../config/r2.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import _appConfig from '../config/config.js';
import jwt from 'jsonwebtoken';

// Generate :: Unique _Secret
const uniqueSecret = (len: number = 8): string => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Mixing Upper + Random
    let key = upper.charAt(Math.floor(Math.random() * upper.length));
    for (let i = 1; i < len; i++) { key += chars.charAt(Math.floor(Math.random() * chars.length)); }

    // Return
    return key;
};

// Upload Avatar to R2
const uploadAvatar = async (file: File, uuid: string): Promise<string> => {
    const ext = file.type.split('/')[1];
    const key = `images/avatars/${uuid}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Start client
    await r2Client.send(new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
    }));

    // Return
    return `${r2PublicUrl}/${key}`;
};

// Validate Avatar
const validateAvatar = (file: File): string | null => {
    const allowedtypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (!allowedtypes.includes(file.type)) { return 'avatar: only jpeg, png, webp allowed'; }
    if (file.size > maxSize) { return 'avatar: maximum size is 2mb'; };
    return null;
};

// Generate :: Sign Token
const signToken = (_idx: number, role: string) => {
    const jwtConf = _appConfig.jwt;

    // Make access token : during login it use once
    const accesstoken = jwt.sign(
        { _idx, role },
        jwtConf.secretKey as string,
        { expiresIn: jwtConf.expiresIn as any }
    );

    // Make refresh token : server validate every time you do shit
    const refreshtoken = jwt.sign(
        { _idx },
        jwtConf.refreshSecretKey as string,
        { expiresIn: jwtConf.refreshExpiresIn as any }
    );

    // Return
    return { accesstoken, refreshtoken };
};

// Export
export { uniqueSecret, uploadAvatar, validateAvatar, signToken };