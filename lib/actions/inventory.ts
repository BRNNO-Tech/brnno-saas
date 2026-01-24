'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { getBusinessId } from './utils'
import { isDemoMode } from '@/lib/demo/utils'
import {
    MOCK_INVENTORY_CATEGORIES,
    MOCK_INVENTORY_ITEMS,
    MOCK_INVENTORY_ADJUSTMENTS,
    MOCK_INVENTORY_USAGE_LOGS,
    MOCK_INVENTORY_LOCATIONS
} from '@/lib/demo/mock-data'

// Types
export interface InventoryItem {
    id: string
    business_id: string
    category_id: string | null
    name: string
    sku: string | null
    unit_of_measure: string
    cost_per_unit: number | null
    vendor: string | null
    current_quantity: number
    low_stock_threshold: number
    notes: string | null
    created_at: string
    updated_at: string
    category?: {
        id: string
        name: string
    } | null
}

export interface InventoryCategory {
    id: string
    business_id: string
    name: string
    description: string | null
    created_at: string
}

export interface InventoryAdjustment {
    id: string
    item_id: string
    location_id: string | null
    adjusted_by: string | null
    adjustment_type: 'add' | 'remove' | 'adjust' | 'transfer'
    quantity_change: number
    quantity_after: number
    reason: string | null
    cost: number | null
    vendor: string | null
    notes: string | null
    created_at: string
    item?: {
        name: string
    }
    adjusted_by_member?: {
        name: string
    }
}

export interface InventoryUsageLog {
    id: string
    item_id: string
    job_id: string | null
    team_member_id: string | null
    quantity_used: number
    date_used: string
    notes: string | null
    created_at: string
    item?: {
        name: string
    }
    job?: {
        id: string
        title: string
    }
    team_member?: {
        name: string
    }
}

// ============================================
// Categories
// ============================================

export async function getInventoryCategories() {
    if (await isDemoMode()) {
        return MOCK_INVENTORY_CATEGORIES
    }

    // Prevent caching to ensure fresh category data
    noStore()

    try {
        const supabase = await createClient()
        const businessId = await getBusinessId()

        // Use cache: 'no-store' to ensure fresh data, especially after category creation
        const { data: categories, error } = await supabase
            .from('inventory_categories')
            .select('*')
            .eq('business_id', businessId)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching inventory categories:', {
                error,
                businessId,
                message: error.message,
                code: error.code,
                details: error.details
            })
            // Return empty array instead of throwing to prevent UI crashes
            return []
        }

        return categories || []
    } catch (err) {
        console.error('Exception fetching inventory categories:', err)
        return []
    }
}

// Alias for compatibility
export const getCategories = getInventoryCategories

export async function createInventoryCategory(formData: FormData) {
    if (await isDemoMode()) {
        return
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const categoryData = {
        business_id: businessId,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
    }

    const { error } = await supabase
        .from('inventory_categories')
        .insert(categoryData)

    if (error) {
        console.error('Error creating inventory category:', error)
        throw error
    }

    // Revalidate all inventory routes to update category dropdowns
    // Using 'layout' type to clear all nested routes including /new and /[id]/edit
    revalidatePath('/dashboard/inventory', 'layout')
    // Also explicitly revalidate the specific pages that use categories
    revalidatePath('/dashboard/inventory/new', 'page')
    revalidatePath('/dashboard/inventory', 'page')
}

export async function updateInventoryCategory(id: string, formData: FormData) {
    if (await isDemoMode()) {
        return
    }

    const supabase = await createClient()

    const categoryData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
    }

    const { error } = await supabase
        .from('inventory_categories')
        .update(categoryData)
        .eq('id', id)

    if (error) {
        console.error('Error updating inventory category:', error)
        throw error
    }

    revalidatePath('/dashboard/inventory')
}

export async function deleteInventoryCategory(id: string) {
    if (await isDemoMode()) {
        return
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting inventory category:', error)
        throw error
    }

    revalidatePath('/dashboard/inventory')
}

// ============================================
// Items
// ============================================

export async function getInventoryStats() {
    if (await isDemoMode()) {
        const items = MOCK_INVENTORY_ITEMS
        const totalItems = items.length
        const lowStockItems = items.filter(
            item => item.current_quantity > 0 && item.current_quantity <= item.low_stock_threshold
        ).length
        const outOfStockItems = items.filter(item => item.current_quantity === 0).length
        const totalValue = items.reduce((sum, item) => {
            return sum + (item.current_quantity * (item.cost_per_unit || 0))
        }, 0)

        return {
            totalItems,
            lowStockItems,
            outOfStockItems,
            totalValue,
        }
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: items, error } = await supabase
        .from('inventory_items')
        .select('current_quantity, low_stock_threshold, cost_per_unit')
        .eq('business_id', businessId)

    if (error) {
        console.error('Error fetching inventory stats:', error)
        throw error
    }

    const totalItems = items?.length || 0
    const lowStockItems = items?.filter(
        item => item.current_quantity > 0 && item.current_quantity <= item.low_stock_threshold
    ).length || 0
    const outOfStockItems = items?.filter(item => item.current_quantity === 0).length || 0
    const totalValue = items?.reduce((sum, item) => {
        return sum + (item.current_quantity * (item.cost_per_unit || 0))
    }, 0) || 0

    return {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue,
    }
}

export async function getInventoryItems() {
    if (await isDemoMode()) {
        return MOCK_INVENTORY_ITEMS
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: items, error } = await supabase
        .from('inventory_items')
        .select(`
      *,
      category:inventory_categories(id, name)
    `)
        .eq('business_id', businessId)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching inventory items:', error)
        throw error
    }

    return items || []
}

export async function getInventoryItem(id: string) {
    if (await isDemoMode()) {
        const item = MOCK_INVENTORY_ITEMS.find(i => i.id === id)
        if (!item) {
            return null
        }

        // Get adjustments and usage logs for this item
        const adjustments = MOCK_INVENTORY_ADJUSTMENTS
            .filter(adj => adj.item_id === id)
            .slice(0, 10)
        const usageLogs = MOCK_INVENTORY_USAGE_LOGS
            .filter(log => log.item_id === id)
            .slice(0, 10)

        return {
            ...item,
            adjustments,
            usage_logs: usageLogs,
        }
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: item, error } = await supabase
        .from('inventory_items')
        .select(`
      *,
      category:inventory_categories(id, name)
    `)
        .eq('id', id)
        .eq('business_id', businessId)
        .single()

    if (error) {
        console.error('Error fetching inventory item:', error)
        throw error
    }

    if (!item) {
        return null
    }

    // Fetch adjustments and usage logs
    const [adjustmentsResult, usageLogsResult] = await Promise.all([
        supabase
            .from('inventory_adjustments')
            .select(`
                *,
                adjusted_by_member:team_members(id, name)
            `)
            .eq('item_id', id)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase
            .from('inventory_usage_logs')
            .select(`
                *,
                job:jobs(id, title),
                team_member:team_members(id, name)
            `)
            .eq('item_id', id)
            .order('date_used', { ascending: false })
            .limit(10)
    ])

    return {
        ...item,
        adjustments: adjustmentsResult.data || [],
        usage_logs: usageLogsResult.data || [],
    }
}

export async function createInventoryItem(formData: FormData) {
    if (await isDemoMode()) {
        // Return a mock item for demo mode
        return {
            id: `demo-item-${Date.now()}`,
            business_id: 'demo-business-id',
            category_id: formData.get('category_id') as string || null,
            name: formData.get('name') as string,
            sku: formData.get('sku') as string || null,
            unit_of_measure: formData.get('unit_of_measure') as string,
            cost_per_unit: formData.get('cost_per_unit') ? parseFloat(formData.get('cost_per_unit') as string) : null,
            vendor: formData.get('vendor') as string || null,
            current_quantity: formData.get('current_quantity') ? parseFloat(formData.get('current_quantity') as string) : 0,
            low_stock_threshold: formData.get('low_stock_threshold') ? parseFloat(formData.get('low_stock_threshold') as string) : 0,
            notes: formData.get('notes') as string || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const itemData = {
        business_id: businessId,
        category_id: formData.get('category_id') as string || null,
        name: formData.get('name') as string,
        sku: formData.get('sku') as string || null,
        unit_of_measure: formData.get('unit_of_measure') as string,
        cost_per_unit: formData.get('cost_per_unit') ? parseFloat(formData.get('cost_per_unit') as string) : null,
        vendor: formData.get('vendor') as string || null,
        current_quantity: formData.get('current_quantity') ? parseFloat(formData.get('current_quantity') as string) : 0,
        low_stock_threshold: formData.get('low_stock_threshold') ? parseFloat(formData.get('low_stock_threshold') as string) : 0,
        notes: formData.get('notes') as string || null,
    }

    const { data: item, error } = await supabase
        .from('inventory_items')
        .insert(itemData)
        .select()
        .single()

    if (error) {
        console.error('Error creating inventory item:', error)
        throw error
    }

    // Create initial adjustment record
    if (item && item.current_quantity > 0) {
        await supabase
            .from('inventory_adjustments')
            .insert({
                item_id: item.id,
                adjustment_type: 'add',
                quantity_change: item.current_quantity,
                quantity_after: item.current_quantity,
                reason: 'initial_stock',
                notes: 'Initial stock entry',
            })
    }

    revalidatePath('/dashboard/inventory')
    return item
}

export async function updateInventoryItem(id: string, formData: FormData) {
    if (await isDemoMode()) {
        return
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Get current item to track quantity changes
    const { data: currentItem } = await supabase
        .from('inventory_items')
        .select('current_quantity')
        .eq('id', id)
        .eq('business_id', businessId)
        .single()

    const itemData = {
        category_id: formData.get('category_id') as string || null,
        name: formData.get('name') as string,
        sku: formData.get('sku') as string || null,
        unit_of_measure: formData.get('unit_of_measure') as string,
        cost_per_unit: formData.get('cost_per_unit') ? parseFloat(formData.get('cost_per_unit') as string) : null,
        vendor: formData.get('vendor') as string || null,
        low_stock_threshold: formData.get('low_stock_threshold') ? parseFloat(formData.get('low_stock_threshold') as string) : 0,
        notes: formData.get('notes') as string || null,
    }

    const { error } = await supabase
        .from('inventory_items')
        .update(itemData)
        .eq('id', id)
        .eq('business_id', businessId)

    if (error) {
        console.error('Error updating inventory item:', error)
        throw error
    }

    revalidatePath('/dashboard/inventory')
    revalidatePath(`/dashboard/inventory/${id}`)
}

export async function deleteInventoryItem(id: string) {
    if (await isDemoMode()) {
        return
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId)

    if (error) {
        console.error('Error deleting inventory item:', error)
        throw error
    }

    revalidatePath('/dashboard/inventory')
}

// ============================================
// Low Stock
// ============================================

export async function getLowStockItems() {
    if (await isDemoMode()) {
        return MOCK_INVENTORY_ITEMS.filter(
            item => item.current_quantity > 0 && item.current_quantity <= item.low_stock_threshold
        )
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: items, error } = await supabase
        .rpc('get_low_stock_items', { p_business_id: businessId })

    if (error) {
        console.error('Error fetching low stock items:', error)
        throw error
    }

    return items || []
}

// ============================================
// Adjustments
// ============================================

export async function adjustInventory(
    itemId: string,
    adjustmentType: 'add' | 'remove' | 'adjust',
    quantityChange: number,
    reason: string | null = null,
    cost: number | null = null,
    vendor: string | null = null,
    notes: string | null = null,
    locationId: string | null = null
) {
    if (await isDemoMode()) {
        return
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Get current item
    const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('current_quantity')
        .eq('id', itemId)
        .eq('business_id', businessId)
        .single()

    if (itemError || !item) {
        throw new Error('Item not found')
    }

    // Calculate new quantity
    let quantityAfter: number
    if (adjustmentType === 'adjust') {
        quantityAfter = quantityChange // Direct set
    } else if (adjustmentType === 'add') {
        quantityAfter = item.current_quantity + quantityChange
    } else {
        quantityAfter = Math.max(0, item.current_quantity - Math.abs(quantityChange))
    }

    // Get current user's team member ID if available
    const { data: { user } } = await supabase.auth.getUser()
    let adjustedBy: string | null = null
    if (user) {
        const { data: teamMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('business_id', businessId)
            .eq('user_id', user.id)
            .single()

        adjustedBy = teamMember?.id || null
    }

    // Create adjustment record (trigger will update item quantity)
    const { error: adjustmentError } = await supabase
        .from('inventory_adjustments')
        .insert({
            item_id: itemId,
            location_id: locationId,
            adjusted_by: adjustedBy,
            adjustment_type: adjustmentType,
            quantity_change: adjustmentType === 'adjust'
                ? quantityAfter - item.current_quantity
                : quantityChange,
            quantity_after: quantityAfter,
            reason: reason,
            cost: cost,
            vendor: vendor,
            notes: notes,
        })

    if (adjustmentError) {
        console.error('Error creating inventory adjustment:', adjustmentError)
        throw adjustmentError
    }

    revalidatePath('/dashboard/inventory')
    revalidatePath(`/dashboard/inventory/${itemId}`)
}

// ============================================
// Wrapper functions for FormData-based actions
// ============================================

export async function addStock(formData: FormData) {
    const itemId = formData.get('item_id') as string
    const quantity = parseFloat(formData.get('quantity') as string)
    const cost = formData.get('cost') ? parseFloat(formData.get('cost') as string) : null
    const vendor = formData.get('vendor') as string || null
    const notes = formData.get('notes') as string || null

    // Cost is total cost for the purchase, not per unit
    await adjustInventory(
        itemId,
        'add',
        quantity,
        'restock',
        cost,
        vendor,
        notes
    )
}

export async function removeStock(formData: FormData) {
    const itemId = formData.get('item_id') as string
    const quantity = parseFloat(formData.get('quantity') as string)
    const reason = formData.get('reason') as string || 'usage'
    const notes = formData.get('notes') as string || null

    await adjustInventory(
        itemId,
        'remove',
        quantity,
        reason,
        null,
        null,
        notes
    )
}

export async function adjustStock(formData: FormData) {
    const itemId = formData.get('item_id') as string
    const newQuantity = parseFloat(formData.get('new_quantity') as string)
    const reason = formData.get('reason') as string || 'correction'
    const notes = formData.get('notes') as string || null

    await adjustInventory(
        itemId,
        'adjust',
        newQuantity,
        reason,
        null,
        null,
        notes
    )
}

export async function logUsage(formData: FormData) {
    const itemId = formData.get('item_id') as string
    const quantityUsed = parseFloat(formData.get('quantity_used') as string)
    const jobId = formData.get('job_id') as string || null
    const teamMemberId = formData.get('team_member_id') as string || null
    const notes = formData.get('notes') as string || null

    await logInventoryUsage(
        itemId,
        quantityUsed,
        jobId,
        teamMemberId,
        notes
    )
}

export async function duplicateInventoryItem(itemId: string) {
    const item = await getInventoryItem(itemId)
    if (!item) throw new Error('Item not found')

    const formData = new FormData()
    formData.set('name', `${item.name} (Copy)`)
    formData.set('sku', item.sku || '')
    formData.set('category_id', item.category_id || '')
    formData.set('unit_of_measure', item.unit_of_measure)
    formData.set('cost_per_unit', item.cost_per_unit?.toString() || '')
    formData.set('vendor', item.vendor || '')
    formData.set('current_quantity', '0') // Start with 0
    formData.set('low_stock_threshold', item.low_stock_threshold.toString())
    formData.set('notes', item.notes || '')

    return await createInventoryItem(formData)
}

export async function getInventoryAdjustments(itemId?: string) {
    if (await isDemoMode()) {
        if (itemId) {
            return MOCK_INVENTORY_ADJUSTMENTS.filter(adj => adj.item_id === itemId)
        }
        return MOCK_INVENTORY_ADJUSTMENTS
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    let query = supabase
        .from('inventory_adjustments')
        .select(`
      *,
      item:inventory_items!inner(id, name, business_id),
      adjusted_by_member:team_members(id, name)
    `)
        .eq('item.business_id', businessId)
        .order('created_at', { ascending: false })

    if (itemId) {
        query = query.eq('item_id', itemId)
    }

    const { data: adjustments, error } = await query

    if (error) {
        console.error('Error fetching inventory adjustments:', error)
        throw error
    }

    return adjustments || []
}

// ============================================
// Usage Logs
// ============================================

export async function logInventoryUsage(
    itemId: string,
    quantityUsed: number,
    jobId: string | null = null,
    teamMemberId: string | null = null,
    notes: string | null = null
) {
    if (await isDemoMode()) {
        return
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Verify item belongs to business
    const { data: item } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('id', itemId)
        .eq('business_id', businessId)
        .single()

    if (!item) {
        throw new Error('Item not found')
    }

    // Create usage log
    const { error: logError } = await supabase
        .from('inventory_usage_logs')
        .insert({
            item_id: itemId,
            job_id: jobId,
            team_member_id: teamMemberId,
            quantity_used: quantityUsed,
            notes: notes,
        })

    if (logError) {
        console.error('Error creating usage log:', logError)
        throw logError
    }

    // Automatically adjust inventory (remove used quantity)
    await adjustInventory(
        itemId,
        'remove',
        quantityUsed,
        'job_usage',
        null,
        null,
        notes || `Used for job ${jobId || 'manual entry'}`
    )

    revalidatePath('/dashboard/inventory')
}

export async function getInventoryUsageLogs(itemId?: string, jobId?: string) {
    if (await isDemoMode()) {
        let logs = MOCK_INVENTORY_USAGE_LOGS
        if (itemId) {
            logs = logs.filter(log => log.item_id === itemId)
        }
        if (jobId) {
            logs = logs.filter(log => log.job_id === jobId)
        }
        return logs
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    let query = supabase
        .from('inventory_usage_logs')
        .select(`
      *,
      item:inventory_items!inner(id, name, business_id),
      job:jobs(id, title),
      team_member:team_members(id, name)
    `)
        .eq('item.business_id', businessId)
        .order('date_used', { ascending: false })

    if (itemId) {
        query = query.eq('item_id', itemId)
    }

    if (jobId) {
        query = query.eq('job_id', jobId)
    }

    const { data: logs, error } = await query

    if (error) {
        console.error('Error fetching usage logs:', error)
        throw error
    }

    return logs || []
}

// ============================================
// Locations (for future multi-location support)
// ============================================

export async function getInventoryLocations() {
    if (await isDemoMode()) {
        return MOCK_INVENTORY_LOCATIONS
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: locations, error } = await supabase
        .from('inventory_locations')
        .select('*')
        .eq('business_id', businessId)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching inventory locations:', error)
        throw error
    }

    return locations || []
}

export async function createInventoryLocation(formData: FormData) {
    if (await isDemoMode()) {
        return
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const isDefault = formData.get('is_default') === 'true'

    // If setting as default, unset other defaults
    if (isDefault) {
        await supabase
            .from('inventory_locations')
            .update({ is_default: false })
            .eq('business_id', businessId)
            .eq('is_default', true)
    }

    const locationData = {
        business_id: businessId,
        name: formData.get('name') as string,
        address: formData.get('address') as string || null,
        is_default: isDefault,
    }

    const { error } = await supabase
        .from('inventory_locations')
        .insert(locationData)

    if (error) {
        console.error('Error creating inventory location:', error)
        throw error
    }

    revalidatePath('/dashboard/inventory')
}