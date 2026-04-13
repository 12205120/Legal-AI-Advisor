const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Rate Limiting: Max 10 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: 'failed', error: 'Too many requests, please try again later.' }
});
app.use('/send-otp', limiter);

// In-memory store (In production, use Redis)
// Format: { email: { hash: string, expiry: number, attempts: number } }
const otpStore = new Map();

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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

    otpStore.set(email, { hash: hashedOTP, expiry, attempts: 0 });

    // Gmail SMTP Configuration
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
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #4CAF50;">Nyaya AI Verification</h2>
                <p>Your OTP Code is:</p>
                <div style="font-size: 24px; font-weight: bold; padding: 10px; background: #f4f4f4; text-align: center; border-radius: 5px;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `
    };

    try {
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log('--- NYAYA AI DEBUG ---');
            console.log(`OTP for ${email}: ${otp}`);
            console.log('----------------------');
        }
        res.json({ status: 'success', message: 'OTP sent to email.', debugOTP: process.env.NODE_ENV !== 'production' ? otp : null });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ status: 'failed', error: 'Failed to send email' });
    }
});

// POST /verify-otp
app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ status: 'failed', error: 'Email and OTP are required' });
    }

    const record = otpStore.get(email);
    if (!record) {
        return res.status(400).json({ status: 'failed', error: 'No OTP requested for this email' });
    }

    if (Date.now() > record.expiry) {
        otpStore.delete(email);
        return res.status(400).json({ status: 'failed', error: 'OTP has expired' });
    }

    if (record.attempts >= 3) {
        otpStore.delete(email);
        return res.status(400).json({ status: 'failed', error: 'Too many failed attempts. Request a new OTP.' });
    }

    const isValid = await bcrypt.compare(otp.toString(), record.hash);
    if (isValid) {
        otpStore.delete(email);
        res.json({ status: 'success', message: 'OTP verified' });
    } else {
        record.attempts += 1;
        res.status(400).json({ status: 'failed', error: `Invalid OTP. ${3 - record.attempts} attempts remaining.` });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Nyaya Auth Server running on port ${PORT}`);
});
