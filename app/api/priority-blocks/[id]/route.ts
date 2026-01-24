import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        // Ensure block belongs to user's business
        const { data: block } = await supabase
            .from('priority_time_blocks')
            .select('id, business_id, businesses!inner(owner_id)')
            .eq('id', id)
            .eq('businesses.owner_id', user.id)
            .single()

        if (!block) {
            return NextResponse.json({ error: 'Priority block not found' }, { status: 404 })
        }

        const { error } = await supabase
            .from('priority_time_blocks')
            .update(body)
            .eq('id', id)

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating priority block:', error)
        return NextResponse.json(
            { error: 'Failed to update priority block' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Ensure block belongs to user's business
        const { data: block } = await supabase
            .from('priority_time_blocks')
            .select('id, business_id, businesses!inner(owner_id)')
            .eq('id', id)
            .eq('businesses.owner_id', user.id)
            .single()

        if (!block) {
            return NextResponse.json({ error: 'Priority block not found' }, { status: 404 })
        }

        const { error } = await supabase
            .from('priority_time_blocks')
            .delete()
            .eq('id', id)

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting priority block:', error)
        return NextResponse.json(
            { error: 'Failed to delete priority block' },
            { status: 500 }
        )
    }
}
