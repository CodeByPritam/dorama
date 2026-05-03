import { generateUniqueSecret, validateAvatar, uploadAvatartoR2, generateSignToken } from './auth.utils.js';
import type { Context, Handler } from 'hono';
import { employees, users } from '../schema.js';
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { v7 } from 'uuid';

/* ====================================================================== */
/* ==================== @types :: auth.controller.ts ==================== */
/* ====================================================================== */

// @interface : ApiError
interface ApiError {
    type: string;
    http_status_code: number;
};

// @interface : ApiResponse
interface ApiResponse {
    tracking_id: string;
    success: boolean;
    payload: unknown | [];
    message: string;
    error: ApiError | null;
    timestamp: string;
};

// @interface : JwtConfig
interface JwtConfig {
    secretKey: string;
    expiresIn: string;
    refreshSecretKey: string;
    refreshExpiresIn: string;
};

// Error Mapping
const ERROR_MAPPING: Record<string, number> = {
    VALIDATION_ERROR:             400,
    AUTH_EMAIL_ALREADY_EXISTS:    400,
    AUTH_USERNAME_ALREADY_EXISTS: 400,
    AUTH_PHONE_ALREADY_EXISTS:    400,
    AUTH_INVALID_CREDENTIALS:     401,
    AUTH_UNVERIFIED_ACCOUNT:      401,
    AUTH_ACCOUNT_BANNED:          403,
    NOT_FOUND:                    404,
    INTERNAL_SERVER_ERROR:        500,
};

// Build Response Helper
const buildResponse = (tracking_id: string, success: boolean, payload: unknown | [], message: string, error: { type: string, }): ApiResponse => {
    return {
        tracking_id: tracking_id,
        success: success,
        payload: payload,
        message: message,
        error: error ? { type: error.type, http_status_code: ERROR_MAPPING[error.type], } : null,
        timestamp: new Date().toISOString(),
    };
};

// Auth Controller
const authController: Handler = async (c: Context) => {
    const action = (c.req.param("action") as string).toLowerCase();
    const trackingID = `tckr_${v7()}`;

    // Sign up
    if (action === 'sign-up' || action === 'register' || action === 'registration') {
        
        // 01: Parse formdata
        const fd = await c.req.formData();
        const name = fd.get('name') as string;
        const avatar = fd.get('avatar') as File | null;
        const username = fd.get('username') as string;
        const phoneno = fd.get('phoneno') as string | null;
        const email = fd.get('email') as string;
        const password = fd.get('password') as string;

        // 02: Validate require fields
        const missing = [!name && 'name', !username && 'username', !email && 'email', !password && 'password'].filter(Boolean);
        if (missing.length) {
            return c.json(buildResponse(
                trackingID, 
                false, 
                [], 
                `${missing.join(', ')} is required!`, 
                { type: 'VALIDATION_ERROR' },
            ), 400);
        }

        // 03: Validate password length
        if (password.length < 8 || password.length > 72) {
            return c.json(buildResponse(
                trackingID, 
                false, 
                [],
                'password length should be >8 and <72 characters!',
                { type: 'VALIDATION_ERROR' },
            ), 400);
        }

        // 04: Validate avatar if provided
        if (avatar) {
            const avatarError = validateAvatar(avatar);
            if (avatarError) {
                return c.json(buildResponse(
                    trackingID, 
                    false,
                    [],
                    'invalid avatar, please try again!',
                    { type: 'VALIDATION_ERROR' },
                ), 400);
            }
        }

        // Try Logic
        


    }
}

// Export
export default authController;