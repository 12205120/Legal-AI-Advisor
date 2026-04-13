import { NextResponse } from 'next/server';
import { dbQuery } from '../../../lib/auth_db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ status: 'error', error: 'Email and password are required' }, { status: 400 });
        }

        const user = await dbQuery(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password]);

        if (user) {
            return NextResponse.json({ status: 'success', user });
        } else {
            return NextResponse.json({ status: 'error', error: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error: any) {
        console.error('Login API Error:', error);
        return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
    }
}
