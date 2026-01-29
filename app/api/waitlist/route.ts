import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get('origin') || '*';

    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function POST(req: NextRequest) {
    const origin = req.headers.get('origin') || '*';

    try {
        const { email } = await req.json();

        if (!email || !email.trim()) {
            return NextResponse.json(
                { error: 'Email is required' },
                {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': origin },
                }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': origin },
                }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert email into waitlist table
        const { error } = await supabase
            .from('waitlist')
            .insert({
                email: email.toLowerCase().trim(),
                created_at: new Date().toISOString(),
                source: 'landing_page'
            });

        if (error) {
            // Check if it's a duplicate email error
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'This email is already on the waitlist!' },
                    {
                        status: 409,
                        headers: { 'Access-Control-Allow-Origin': origin },
                    }
                );
            }

            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to save email. Please try again.' },
                {
                    status: 500,
                    headers: { 'Access-Control-Allow-Origin': origin },
                }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Successfully added to waitlist!' },
            {
                headers: { 'Access-Control-Allow-Origin': origin },
            }
        );
    } catch (error) {
        console.error('Waitlist API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': origin },
            }
        );
    }
}
