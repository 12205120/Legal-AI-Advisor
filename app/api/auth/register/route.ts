import { NextResponse } from 'next/server';
import { dbRun } from '../../../lib/auth_db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id } = body;

        if (!email || !password) {
            return NextResponse.json({ status: 'error', error: 'Email and password are required' }, { status: 400 });
        }

        await dbRun(`INSERT OR REPLACE INTO users (email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, password, first_name, last_name, role, college, registration_no, govt_id, judicial_id]);

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
    }
}
