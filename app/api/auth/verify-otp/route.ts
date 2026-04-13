import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbQuery, dbRun } from '../../../lib/auth_db';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();
        
        const record = await dbQuery(`SELECT * FROM otps WHERE email = ?`, [email]);

        if (!record) {
            return NextResponse.json({ status: 'failed', error: 'No OTP requested for this email' }, { status: 400 });
        }

        if (Date.now() > record.expiry) {
            await dbRun(`DELETE FROM otps WHERE email = ?`, [email]);
            return NextResponse.json({ status: 'failed', error: 'OTP has expired' }, { status: 400 });
        }

        const isValid = await bcrypt.compare(otp.toString(), record.hash);
        if (isValid) {
            await dbRun(`DELETE FROM otps WHERE email = ?`, [email]);
            await dbRun(`UPDATE users SET verified = 1 WHERE email = ?`, [email]);
            return NextResponse.json({ status: 'success', message: 'OTP verified' });
        } else {
            const newAttempts = record.attempts + 1;
            if (newAttempts >= 3) {
                await dbRun(`DELETE FROM otps WHERE email = ?`, [email]);
                return NextResponse.json({ status: 'failed', error: 'Too many attempts. Request new OTP.' }, { status: 400 });
            }
            await dbRun(`UPDATE otps SET attempts = ? WHERE email = ?`, [newAttempts, email]);
            return NextResponse.json({ status: 'failed', error: `Invalid OTP. ${3 - newAttempts} attempts remaining.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Verify OTP API Error:', error);
        return NextResponse.json({ status: 'failed', error: 'Verification error' }, { status: 500 });
    }
}
