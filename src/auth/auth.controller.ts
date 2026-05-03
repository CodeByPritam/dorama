import { uniqueSecret, validateAvatar, uploadAvatar, signToken } from './auth.utils.js'
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
    ok: boolean;
    msg: string;
    data: unknown | null;
    err: ApiError | null;
    iat: string;
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
const buildResponse = (
    ok: boolean, 
    msg: string, 
    data: unknown | null = null, 
    err: { type: string, } | null = null
): ApiResponse => {
    return {
        ok: ok,
        msg: msg,
        data: ok ? ( data ?? null ) : null,
        err: err ? { type: err.type, http_status_code: ERROR_MAPPING[err.type] ?? 500 } : null,
        iat: new Date().toISOString(),
    };
}

/* ====================================================================== */
/* ==================== @Logic :: auth.controller.ts ==================== */
/* ====================================================================== */

// Auth Controller
const authController: Handler = async (c: Context) => {
    const who = (c.req.param("who") as string).toLowerCase();
    const action = (c.req.param("action") as string).toLowerCase();

    // Employee :: signup
    if (who === 'employee' && action === 'signup') { 

        // 01: Parse formdata
        const form = await c.req.formData();
        const name = form.get('name') as string;
        const avatar = form.get('avatar') as File;
        const username = form.get('username') as string;
        const phoneno = form.get('phoneno') as string;
        const email = form.get('email') as string;
        const password = form.get('password') as string;
        const role = form.get('role') as string;
        const permissionsGranted = ['*'];

        // 02: Validation : { everything 01 }
        // 03: Logic
        try {

            /* ==================================================================== */
            /* =============== Check email, Username, Phoneno exist =============== */
            /* ==================================================================== */
            const emailExist = await db.select({ _idx: employees._idx }).from(employees).where(eq(employees.email, email.toLowerCase().trim())).limit(1);
            const usernameExist = await db.select({ _idx: employees._idx }).from(employees).where(eq(employees.username, username.trim())).limit(1);
            const phonenoExist = await db.select({ _idx: employees._idx }).from(employees).where(eq(employees.phoneno, phoneno.trim())).limit(1);

            const exist = [
                emailExist[0] && 'email is already registered!', 
                usernameExist[0] && 'username is already taken!',
                phonenoExist[0] && 'phone number is already registered!',
            ].filter(Boolean);

            if (exist.length) {
                return c.json(buildResponse(
                    false, 
                    exist.join(', '), 
                    null, 
                    { type: 'VALIDATION_ERROR' }
                ), 400);
            }
            
            /* ======================================================================================= */
            /* ================ Upload avater to r2, Hash password & Inserted into db ================ */
            /* ======================================================================================= */
            const getAvatarUrl = await uploadAvatar(avatar, v7());
            const passwordHash = await bcrypt.hash(password, 12);

            // Inserted
            const inserted = await db.insert(employees)
            .values({
                _secret: uniqueSecret(),
                name: name.trim(),
                avatar_url: getAvatarUrl,
                username: username.trim(),
                phoneno: phoneno.trim(),
                email: email.toLowerCase().trim(),
                password: passwordHash,
                role: role.trim(),
                permissions: permissionsGranted,
            })
            .returning({
                _idx: employees._idx,
                _secret: employees._secret,
                name: employees.name,
                avatar_url: employees.avatar_url,
                username: employees.username,
                phoneno: employees.phoneno,
                email: employees.email,
                role: employees.role,
                permissions: employees.permissions,
                is_verified: employees.is_verified,
                is_baned: employees.is_banned,
                ban_reason: employees.ban_reason,
                created_at: employees.created_at,
            });

            /* ================================================================= */
            /* ================= Store as new employee & Return ================ */
            /* ================================================================= */
            const empinstance = inserted[0];
            return c.json(buildResponse(
                true,
                'employee registration successful',
                { _secret: empinstance._secret },
                null
            ), 201);

        } catch (error) {
            return c.json(buildResponse(
                false,
                'something went wrong on our end!',
                null,
                { type: 'INTERNAL_SERVER_ERROR' }
            ), 500);
        }
    }

    
    if (who === 'employee' && action === 'login') { }
    if (who === 'user' || action === 'signup') { }
    if (who === 'user' || action === 'login') { }
}

// Export
export default authController;