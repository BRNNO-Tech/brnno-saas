export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY
        if (!apiKey) {
            console.error('OpenWeatherMap API key not configured')
            return null
        }

        // Try with country code for better results
        const addressWithCountry = address.includes(',US') ? address : `${address},US`

        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(addressWithCountry)}&limit=1&appid=${apiKey}`
        )

        if (!response.ok) {
            console.error('Geocoding API request failed:', response.status)
            return null
        }

        const data = await response.json()

        if (!data || data.length === 0) {
            console.error('No geocoding results found for address:', address)
            return null
        }

        return {
            lat: data[0].lat,
            lon: data[0].lon
        }
    } catch (error) {
        console.error('Geocoding error:', error)
        return null
    }
}
