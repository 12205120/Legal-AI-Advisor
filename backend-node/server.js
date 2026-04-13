const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ==============================
// 1. DATABASE INITIALIZATION
// ==============================
const dbPath = path.resolve(__dirname, 'nyaya_users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to SQLite database at:', dbPath);
});

// Create tables
db.serialize(() => {
    // Users table
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

    // OTPs table
    db.run(`CREATE TABLE IF NOT EXISTS otps (
        email TEXT PRIMARY KEY,
        hash TEXT,
        expiry INTEGER,
        attempts INTEGER DEFAULT 0
    )`);
});

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { status: 'failed', error: 'Too many requests, please try again later.' }
});
app.use('/send-otp', limiter);

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==============================
// 2. AUTHENTICATION ENDPOINTS
// ==============================

// POST /register
app.post('/register', async (req, res) => {
    const { email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ status: 'error', error: 'Email and password are required' });
    }

    try {
        // We use plain password for now to match exactly what the user had, 
        // but it's recommended to hash it. The user's Python code didn't hash it (verified in main.py:858)
        db.run(`INSERT OR REPLACE INTO users (email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id],
                (err) => {
                    if (err) {
                        console.error('Registration error:', err);
                        return res.status(500).json({ status: 'error', error: 'Database insertion failed' });
                    }
                    res.json({ status: 'success' });
                });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// POST /login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ status: 'error', error: 'Database query failed' });
        }
        if (row) {
            res.json({ status: 'success', user: row });
        } else {
            res.status(401).json({ status: 'error', error: 'Invalid credentials' });
        }
    });
});

// ==============================
// 3. OTP ENDPOINTS
// ==============================

// POST /send-otp
app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ status: 'failed', error: 'Invalid email address' });
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    db.run(`INSERT OR REPLACE INTO otps (email, hash, expiry, attempts) VALUES (?, ?, ?, ?)`, 
           [email, hashedOTP, expiry, 0], (err) => {
        if (err) console.error('OTP Save Error:', err);
    });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Nyaya AI" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your OTP Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; background: #000; color: #fff;">
                <h2 style="color: #f21c1c;">Nyaya AI Verification</h2>
                <p>Your OTP Code is:</p>
                <div style="font-size: 32px; font-weight: bold; padding: 20px; background: #111; text-align: center; border: 1px solid #f21c1c; border-radius: 10px; color: #ecb31c;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `
    };

    try {
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            res.json({ status: 'success', message: 'OTP sent to email.' });
        } else {
            res.json({ 
                status: 'success', 
                message: 'ACTION REQUIRED: Please fill in your Gmail credentials. (Debug Code: ' + otp + ')',
                debugOTP: otp 
            });
        }
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ status: 'failed', error: 'Failed to send email' });
    }
});

// POST /verify-otp
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    
    db.get(`SELECT * FROM otps WHERE email = ?`, [email], async (err, record) => {
        if (err || !record) {
            return res.status(400).json({ status: 'failed', error: 'No OTP requested for this email' });
        }

        if (Date.now() > record.expiry) {
            db.run(`DELETE FROM otps WHERE email = ?`, [email]);
            return res.status(400).json({ status: 'failed', error: 'OTP has expired' });
        }

        const isValid = await bcrypt.compare(otp.toString(), record.hash);
        if (isValid) {
            db.run(`DELETE FROM otps WHERE email = ?`, [email]);
            db.run(`UPDATE users SET verified = 1 WHERE email = ?`, [email]);
            res.json({ status: 'success', message: 'OTP verified' });
        } else {
            const newAttempts = record.attempts + 1;
            if (newAttempts >= 3) {
                db.run(`DELETE FROM otps WHERE email = ?`, [email]);
                return res.status(400).json({ status: 'failed', error: 'Too many attempts. Request new OTP.' });
            }
            db.run(`UPDATE otps SET attempts = ? WHERE email = ?`, [newAttempts, email]);
            res.status(400).json({ status: 'failed', error: `Invalid OTP. ${3 - newAttempts} attempts remaining.` });
        }
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Nyaya Auth Server (Consolidated) running on port ${PORT}`);
});
