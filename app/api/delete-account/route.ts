import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/delete-account
 * Permanently deletes a user's account and all associated business data
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Get business ID
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (businessError || !business) {
            return NextResponse.json(
                { error: 'No business found' },
                { status: 404 }
            )
        }

        // Use service role client for deletions
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        const supabaseService = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Delete all related data (cascade should handle most, but we'll be explicit)
        const businessId = business.id
        const userId = user.id

        // Delete in order (child tables first)
        const tables = [
            'business_subscription_addons',
            'smart_notifications',
            'sequences',
            'sequence_steps',
            'discount_codes',
            'marketplace_reviews',
            'scripts',
            'priority_time_blocks',
            'booking_photos',
            'job_access_codes',
            'invoices',
            'quotes',
            'mileage_entries',
            'jobs',
            'leads',
            'customers',
            'services',
            'service_addons',
            'business_hours',
            'team_members',
            'webhooks',
        ]

        // Delete from each table
        for (const table of tables) {
            try {
                await supabaseService
                    .from(table)
                    .delete()
                    .eq('business_id', businessId)
            } catch (error) {
                console.error(`Error deleting from ${table}:`, error)
                // Continue with other tables even if one fails
            }
        }

        // Delete the business itself
        const { error: deleteBusinessError } = await supabaseService
            .from('businesses')
            .delete()
            .eq('id', businessId)

        if (deleteBusinessError) {
            console.error('Error deleting business:', deleteBusinessError)
            return NextResponse.json(
                { error: 'Failed to delete business data' },
                { status: 500 }
            )
        }

        // Finally, delete the auth user
        const { error: deleteUserError } = await supabaseService.auth.admin.deleteUser(userId)

        if (deleteUserError) {
            console.error('Error deleting user:', deleteUserError)
            return NextResponse.json(
                { error: 'Failed to delete user account' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully'
        })

    } catch (error: any) {
        console.error('Error in delete-account:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
