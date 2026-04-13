import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { dbRun } from '../../../lib/auth_db';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        if (!email || !email.includes('@')) {
            return NextResponse.json({ status: 'failed', error: 'Invalid email address' }, { status: 400 });
        }

        const otp = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);
        const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

        await dbRun(`INSERT OR REPLACE INTO otps (email, hash, expiry, attempts) VALUES (?, ?, ?, ?)`, 
               [email, hashedOTP, expiry, 0]);

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

        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            return NextResponse.json({ status: 'success', message: 'OTP sent to email.' });
        } else {
            return NextResponse.json({ 
                status: 'success', 
                message: 'ACTION REQUIRED: Please fill in your Gmail credentials in the .env. (Debug: Check server terminal for OTP)',
            });
        }
    } catch (error: any) {
        console.error('--- OTP DELIVERY FAILURE ---');
        console.error('Error Details:', error.message);
        console.error('Stack:', error.stack);
        if (error.code === 'EAUTH') {
            console.error('CHECK: GMAIL_USER and GMAIL_PASS might be incorrect or missing App Password.');
        }
        return NextResponse.json({ status: 'failed', error: 'Failed to send email: ' + error.message }, { status: 500 });
    }
}
