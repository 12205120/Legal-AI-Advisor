import sqlite3 from 'sqlite3';
import path from 'path';

// For serverless functions, we try to use a persistent path if possible, 
// but local SQLite usually resets on Vercel. 
// Recommend using SUPABASE_URL for real persistence.
const dbPath = path.resolve(process.cwd(), 'nyaya_users.db');

export const db = new sqlite3.Database(dbPath);

// Initialize tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT,
        college TEXT,
        registration_no TEXT,
        govt_id TEXT,
        judicial_id TEXT,
        verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS otps (
        email TEXT PRIMARY KEY,
        hash TEXT,
        expiry INTEGER,
        attempts INTEGER DEFAULT 0
    )`);
});

export const dbQuery = (query: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

export const dbRun = (query: string, params: any[] = []): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

export const dbAll = (query: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};
