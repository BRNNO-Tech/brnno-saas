import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
        return NextResponse.json(
            { error: 'Latitude and longitude required' },
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
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`,
            { next: { revalidate: 10800 } }
        )

        if (!response.ok) {
            throw new Error('Weather API request failed')
        }

        const data = await response.json()

        const dailyForecasts: Record<string, {
            date: string
            temp_high: number
            temp_low: number
            condition: string
            icon: string
            rain_probability: number
            description: string
        }> = {}

        data.list.forEach((item: any) => {
            const date = item.dt_txt.split(' ')[0]

            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    date,
                    temp_high: item.main.temp_max,
                    temp_low: item.main.temp_min,
                    condition: item.weather[0].main,
                    icon: item.weather[0].icon,
                    rain_probability: item.pop * 100,
                    description: item.weather[0].description
                }
            } else {
                dailyForecasts[date].temp_high = Math.max(
                    dailyForecasts[date].temp_high,
                    item.main.temp_max
                )
                dailyForecasts[date].temp_low = Math.min(
                    dailyForecasts[date].temp_low,
                    item.main.temp_min
                )
                dailyForecasts[date].rain_probability = Math.max(
                    dailyForecasts[date].rain_probability,
                    item.pop * 100
                )
            }
        })

        return NextResponse.json({ forecasts: dailyForecasts })
    } catch (error) {
        console.error('Weather API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch weather data' },
            { status: 500 }
        )
    }
}
