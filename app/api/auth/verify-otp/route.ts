import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbQuery, dbRun } from '../../../lib/auth_db';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();
        console.log(`VERIFY: Attempting for ${email}`);
        
        const record = await dbQuery(`SELECT * FROM otps WHERE email = ?`, [email]);

        if (!record) {
            console.warn(`VERIFY FAIL: No OTP record found for ${email}`);
            return NextResponse.json({ status: 'failed', error: 'No OTP requested for this email (or session lost)' }, { status: 400 });
        }

        if (Date.now() > record.expiry) {
            console.warn(`VERIFY FAIL: OTP expired for ${email}`);
            await dbRun(`DELETE FROM otps WHERE email = ?`, [email]);
            return NextResponse.json({ status: 'failed', error: 'OTP has expired' }, { status: 400 });
        }

        const isValid = await bcrypt.compare(otp.toString(), record.hash);
        console.log(`VERIFY RESULT: ${isValid ? 'SUCCESS' : 'INVALID'} for ${email}`);

        if (isValid) {
            await dbRun(`DELETE FROM otps WHERE email = ?`, [email]);
            await dbRun(`UPDATE users SET verified = 1 WHERE email = ?`, [email]);
            return NextResponse.json({ status: 'success', message: 'OTP verified' });
        } else {
            const newAttempts = record.attempts + 1;
            console.warn(`VERIFY FAIL: Invalid OTP. Attempt ${newAttempts}/3 for ${email}`);
            
            if (newAttempts >= 3) {
                await dbRun(`DELETE FROM otps WHERE email = ?`, [email]);
                return NextResponse.json({ status: 'failed', error: 'Too many attempts. Request new OTP.' }, { status: 400 });
            }
            await dbRun(`UPDATE otps SET attempts = ? WHERE email = ?`, [newAttempts, email]);
            return NextResponse.json({ status: 'failed', error: `Invalid OTP. ${3 - newAttempts} attempts remaining.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error('VERIFY CRITICAL ERROR:', error.message);
        return NextResponse.json({ status: 'failed', error: 'Verification error: ' + error.message }, { status: 500 });
    }
}
