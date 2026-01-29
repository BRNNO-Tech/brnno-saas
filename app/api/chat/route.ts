import { NextRequest, NextResponse } from 'next/server';

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
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message required' },
                {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': origin,
                    },
                }
            );
        }

        const systemPrompt = `You are BRNNO's helpful AI assistant. You help answer questions about:
- BRNNO's pricing plans (Starter $89/mo, Pro $169/mo, Fleet $299/mo)
- Features like lead recovery, AI scheduling, team management
- ROI calculations for service businesses
- How to book a demo call

Keep responses concise and friendly. If they ask about pricing, mention the 20% yearly discount. If they want to book, direct them to book a call.`;

        // Call Google Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: systemPrompt },
                                { text: message }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150,
                    }
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API error:', data);
            return NextResponse.json(
                { error: 'Failed to generate response' },
                {
                    status: response.status,
                    headers: {
                        'Access-Control-Allow-Origin': origin,
                    },
                }
            );
        }

        const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I had trouble generating a response.';

        return NextResponse.json(
            { message: aiMessage },
            {
                headers: {
                    'Access-Control-Allow-Origin': origin,
                },
            }
        );
    } catch (error) {
        console.error('Chat error:', error);
        const origin = req.headers.get('origin') || '*';
        return NextResponse.json(
            { error: 'Failed to process message' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': origin,
                },
            }
        );
    }
}
