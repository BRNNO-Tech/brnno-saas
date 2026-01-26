import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')

    if (!address) {
        return NextResponse.json(
            { error: 'Address required' },
            { status: 400 }
        )
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY

    if (!apiKey) {
        return NextResponse.json(
            { error: 'OpenWeatherMap API key not configured' },
            { status: 500 }
        )
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address)}&limit=1&appid=${apiKey}`,
            { next: { revalidate: 86400 } }
        )

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            return NextResponse.json(
                {
                    error: 'Geocoding API request failed',
                    status: response.status,
                    details: errorText
                },
                { status: response.status }
            )
        }

        const data = await response.json()
        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json(
                { error: 'No geocoding results' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            lat: data[0].lat,
            lon: data[0].lon
        })
    } catch (error) {
        console.error('Geocoding API error:', error)
        return NextResponse.json(
            { error: 'Failed to geocode address' },
            { status: 500 }
        )
    }
}
