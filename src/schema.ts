import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

// Shared Employee & User Columns
const baseAccountColumns = {
    _idx:        serial('_idx').primaryKey(),
    _secret:     text('_secret').notNull().unique(),

    // Persons: Identity
    name:        text('name').notNull(),
    username:    text('username').notNull().unique(),
    email:       text('email').notNull().unique(),

    // Persons :: password
    password:    text('password').notNull(),

    // Persons :: status
    is_verified: boolean('is_verified').notNull().default(false),
    is_banned:   boolean('is_banned').notNull().default(false),
    ban_reason:  text('ban_reason'),

    // Persons :: activity
    created_at:  timestamp('created_at').notNull().defaultNow(),
    last_login:  timestamp('last_login'),
};

// Create Employee Table Schema
const employees = pgTable('employees', {
    ...baseAccountColumns,
    avatar_url: text('avatar_url').notNull(),
    phoneno: text('phoneno').notNull().unique(),
    role: text('role').notNull(),
    permissions: text('permissions').array().notNull().default([]),
});

// Create User Table Schema
const users = pgTable('users', {
    ...baseAccountColumns,
    avatar_url: text('avatar_url'),
    phoneno: text('phoneno').unique(),
    is_premium: boolean('is_premium').notNull().default(false),
});

// Export
export { employees, users };