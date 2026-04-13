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
        const res = await pool.query(query.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return res.rows[0];
    }
    // MOCK LOGIN
    if (query.includes('SELECT * FROM users')) {
        return mockStore.users.find((u: any) => u.email === params[0] && u.password === params[1]);
    }
    // MOCK OTP SELECT
    if (query.includes('SELECT * FROM otps')) {
        return mockStore.otps.get(params[0]);
    }
    return null;
};

export const dbRun = async (query: string, params: any[] = []): Promise<void> => {
    if (pool) {
        const pgQuery = query.replace(/\?/g, (match, i, full) => {
             // Basic replacement of ? with $1, $2, etc. 
             // This is a naive implementation for the current use cases.
             let count = 0;
             return query.substring(0, full.indexOf(match)).split('?').length + "";
        });
        // Simpler approach for the specific queries we have
        const finalQuery = query
            .replace('INSERT OR REPLACE INTO users', 'INSERT INTO users') // Postgres syntax
            .replace('VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (email) DO UPDATE SET password=$2')
            .replace('INSERT OR REPLACE INTO otps', 'INSERT INTO otps')
            .replace('VALUES (?, ?, ?, ?)', 'VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET hash=$2, expiry=$3, attempts=$4')
            .replace('DELETE FROM otps WHERE email = ?', 'DELETE FROM otps WHERE email = $1')
            .replace('UPDATE users SET verified = 1 WHERE email = ?', 'UPDATE users SET verified = TRUE WHERE email = $1')
            .replace('UPDATE otps SET attempts = ? WHERE email = ?', 'UPDATE otps SET attempts = $1 WHERE email = $2');

        await pool.query(finalQuery, params);
        return;
    }

    // MOCK REGISTRATION
    if (query.includes('INSERT INTO users') || query.includes('INSERT OR REPLACE INTO users')) {
        const [email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id] = params;
        const index = mockStore.users.findIndex((u: any) => u.email === email);
        const user = { email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id };
        if (index > -1) mockStore.users[index] = user;
        else mockStore.users.push(user);
    }
    // MOCK OTP SAVE
    if (query.includes('INSERT INTO otps') || query.includes('INSERT OR REPLACE INTO otps')) {
        const [email, hash, expiry, attempts] = params;
        mockStore.otps.set(email, { email, hash, expiry, attempts });
    }
    // MOCK DELETE
    if (query.includes('DELETE FROM otps')) {
        mockStore.otps.delete(params[0]);
    }
};

export const dbAll = async (query: string, params: any[] = []): Promise<any[]> => {
    if (pool) {
        const res = await pool.query(query.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return res.rows;
    }
    return [];
};
