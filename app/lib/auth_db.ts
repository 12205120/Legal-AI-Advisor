import { Pool } from 'pg';

// For Vercel Serverless, we use Postgres (e.g., Neon or Supabase)
// If local development, we fallback to a mock system to ensure it doesn't crash.

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

let pool: any = null;

if (connectionString) {
    pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false // Required for many cloud providers
        }
    });

    // Initialize tables in Postgres if needed
    const initDb = async () => {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE,
                    password TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    role TEXT,
                    college TEXT,
                    registration_no TEXT,
                    govt_id TEXT,
                    judicial_id TEXT,
                    verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS otps (
                    email TEXT PRIMARY KEY,
                    hash TEXT,
                    expiry BIGINT,
                    attempts INTEGER DEFAULT 0
                )
            `);
        } finally {
            client.release();
        }
    };
    initDb().catch(err => console.error('Postgres Init Error:', err));
} else {
    console.warn('--- DATABASE WARNING ---');
    console.warn('DATABASE_URL is missing. Using in-memory MOCK database.');
    console.warn('Your data will NOT persist in production.');
    console.warn('Get a free DB at neon.tech and add DATABASE_URL to your env.');
}

// Mock store for local dev
const mockStore: any = {
    users: [],
    otps: new Map()
};

export const dbQuery = async (query: string, params: any[] = []): Promise<any> => {
    if (pool) {
        try {
            const pgQuery = query.replace(/\?/g, (_, i) => `$${i + 1}`);
            const res = await pool.query(pgQuery, params);
            return res.rows[0];
        } catch (err: any) {
            console.error('DATABASE QUERY ERROR:', err.message);
            throw err;
        }
    }
    // MOCK MODE
    console.log('MOCK DB: Querying', query, params);
    if (query.includes('FROM users')) return mockStore.users.find((u: any) => u.email === params[0]);
    if (query.includes('FROM otps')) return mockStore.otps.get(params[0]);
    return null;
};

export const dbRun = async (query: string, params: any[] = []): Promise<void> => {
    if (pool) {
        try {
            // Robust replacement for common patterns
            let finalQuery = query;
            if (query.includes('INSERT OR REPLACE INTO users')) {
                finalQuery = `INSERT INTO users (email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                             ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`;
            } else if (query.includes('INSERT OR REPLACE INTO otps')) {
                finalQuery = `INSERT INTO otps (email, hash, expiry, attempts) 
                             VALUES ($1, $2, $3, $4) 
                             ON CONFLICT (email) DO UPDATE SET hash = EXCLUDED.hash, expiry = EXCLUDED.expiry, attempts = EXCLUDED.attempts`;
            } else {
                // General parameter replacement
                let i = 1;
                finalQuery = query.replace(/\?/g, () => `$${i++}`);
            }

            await pool.query(finalQuery, params);
        } catch (err: any) {
            console.error('DATABASE RUN ERROR:', err.message);
            throw err;
        }
        return;
    }

    // MOCK MODE
    console.log('MOCK DB: Running', query, params);
    if (query.includes('users') && (query.includes('INSERT') || query.includes('UPDATE'))) {
        const email = params[0];
        const existing = mockStore.users.findIndex((u: any) => u.email === email);
        if (existing > -1) mockStore.users[existing] = { ...mockStore.users[existing], email };
        else mockStore.users.push({ email });
    }
    if (query.includes('otps')) {
        if (query.includes('INSERT')) mockStore.otps.set(params[0], { email: params[0], hash: params[1], expiry: params[2], attempts: params[3] });
        if (query.includes('DELETE')) mockStore.otps.delete(params[0]);
    }
};

export const dbAll = async (query: string, params: any[] = []): Promise<any[]> => {
    if (pool) {
        const res = await pool.query(query.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return res.rows;
    }
    return [];
};
