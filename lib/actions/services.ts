'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getBusinessId } from './utils';

export interface ServiceFormData {
  name: string;
  description?: string;
  base_price: number;
  base_duration?: number;
  pricing_model?: 'flat' | 'variable';
  variations?: Record<string, { price: number; duration: number; enabled: boolean }>;
  estimated_duration?: number; // Legacy field for backward compatibility
  icon?: string;
  image_url?: string;
  is_popular?: boolean;
  whats_included?: string[];
  is_active?: boolean;
}

export async function getServices() {
  // Check if in demo mode
  const { isDemoMode } = await import('@/lib/demo/utils');
  const { getMockServices } = await import('@/lib/demo/mock-data');
  
  if (await isDemoMode()) {
    return getMockServices();
  }

  const supabase = await createClient();
  const businessId = await getBusinessId();
  
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
  
  return services || [];
}

export async function createService(data: ServiceFormData) {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Ensure estimated_duration is an integer if provided
  // Note: Database column is 'price', not 'base_price'
  // Note: Services table doesn't have 'user_id', only 'business_id'
  const serviceData: any = {
    name: data.name.trim(),
    price: Number(data.base_price), // Map base_price to price column (for backward compatibility)
    business_id: businessId,
    is_active: data.is_active ?? true,
    is_popular: data.is_popular ?? false,
  };
  
  // Add optional fields only if they're provided and not empty
  if (data.description !== undefined && data.description !== null && data.description.trim() !== '') {
    serviceData.description = data.description.trim();
  }
  if (data.icon !== undefined && data.icon !== null && data.icon.trim() !== '') {
    serviceData.icon = data.icon.trim();
  }
  if (data.image_url !== undefined && data.image_url !== null && data.image_url.trim() !== '') {
    serviceData.image_url = data.image_url.trim();
  }
  if (data.whats_included !== undefined && data.whats_included !== null && Array.isArray(data.whats_included) && data.whats_included.length > 0) {
    serviceData.whats_included = data.whats_included;
  }
  
  // Handle new pricing fields
  if (data.pricing_model !== undefined) {
    serviceData.pricing_model = data.pricing_model;
  }
  if (data.base_duration !== undefined && data.base_duration !== null) {
    serviceData.base_duration = Math.round(data.base_duration);
    // Also set estimated_duration for backward compatibility
    serviceData.estimated_duration = Math.round(data.base_duration);
  } else if (data.estimated_duration !== undefined && data.estimated_duration !== null && !isNaN(data.estimated_duration)) {
    // Fallback to legacy field
    serviceData.estimated_duration = Math.round(data.estimated_duration);
    serviceData.base_duration = Math.round(data.estimated_duration);
  }
  
  // Add variations if variable pricing is enabled
  if (data.pricing_model === 'variable' && data.variations) {
    serviceData.variations = data.variations;
  }

  const { data: service, error } = await supabase
    .from('services')
    .insert(serviceData)
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      data: serviceData
    });
    throw error;
  }

  revalidatePath('/services');
  revalidatePath('/booking');
  return service;
}

export async function updateService(id: string, data: ServiceFormData) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Ensure estimated_duration is an integer if provided
  // Note: Database column is 'price', not 'base_price'
  const updateData: any = { ...data };
  
  // Map base_price to price column if provided
  if (updateData.base_price !== undefined) {
    updateData.price = Number(updateData.base_price);
    delete updateData.base_price;
  }
  
  // Handle base_duration and estimated_duration
  // Only update if we have a valid positive value (>= 1 minute)
  if (updateData.base_duration !== undefined && updateData.base_duration !== null && updateData.base_duration > 0) {
    updateData.base_duration = Math.round(updateData.base_duration);
    // Also set estimated_duration for backward compatibility
    updateData.estimated_duration = Math.round(updateData.base_duration);
  } else if (updateData.estimated_duration !== undefined && updateData.estimated_duration !== null && updateData.estimated_duration > 0) {
    // Fallback to legacy field
    updateData.estimated_duration = Math.round(updateData.estimated_duration);
    updateData.base_duration = Math.round(updateData.estimated_duration);
  } else {
    // If duration is 0, null, or undefined, remove it from update to avoid database errors
    delete updateData.base_duration;
    delete updateData.estimated_duration;
  }
  
  // Handle variations - only include if variable pricing
  if (updateData.pricing_model === 'flat' && updateData.variations) {
    // Clear variations when switching to flat
    updateData.variations = {};
  }

  // List of columns that don't exist in the database (filter them out)
  const invalidColumns = ['show_price']; // Add any other non-existent columns here
  
  // Clean up undefined values and invalid columns - Supabase doesn't accept undefined in update objects
  const cleanedUpdateData: any = {};
  for (const [key, value] of Object.entries(updateData)) {
    // Skip undefined values and invalid columns
    if (value !== undefined && !invalidColumns.includes(key)) {
      cleanedUpdateData[key] = value;
    }
  }

  // Ensure we have at least one field to update
  if (Object.keys(cleanedUpdateData).length === 0) {
    throw new Error('No valid fields to update');
  }

  const { data: service, error } = await supabase
    .from('services')
    .update(cleanedUpdateData)
    .eq('id', id)
    .eq('business_id', businessId)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      updateData: cleanedUpdateData,
      originalData: updateData
    });
    // Create a more user-friendly error message
    const errorMessage = error.message || error.hint || 'Failed to update service';
    throw new Error(errorMessage);
  }

  revalidatePath('/services');
  revalidatePath('/booking');
  revalidatePath(`/services/${id}/edit`);
  revalidatePath('/dashboard/services');
  return service;
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', id)
    .eq('business_id', businessId);

  if (error) {
    console.error('Error deleting service:', error);
    throw error;
  }

  revalidatePath('/services');
  revalidatePath('/booking');
  revalidatePath('/dashboard/services');
}

export async function getService(id: string) {
  const { isDemoMode } = await import('@/lib/demo/utils');
  const { getMockServices } = await import('@/lib/demo/mock-data');

  if (await isDemoMode()) {
    const services = getMockServices();
    const service = services.find((s) => s.id === id);
    if (!service) return null;
    return {
      ...service,
      base_price: service.price,
    } as any;
  }

  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (error) {
    console.error('Error fetching service:', error);
    throw error;
  }
  
  if (!service) {
    throw new Error('Service not found');
  }
  
  // Map price to base_price for form compatibility
  // Database uses 'price' but form expects 'base_price'
  if (service.price !== undefined && service.base_price === undefined) {
    service.base_price = service.price;
  }
  
  return service;
}

export async function uploadServiceImage(file: File) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // Use service role client for storage to bypass RLS (we've already verified auth)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for storage upload');
  }

  // Create service role client for storage operations
  const { createClient: createServiceClient } = await import('@supabase/supabase-js');
  const storageClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Upload to Supabase Storage using service role (bypasses RLS)
  const { data, error } = await storageClient.storage
    .from('service-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = storageClient.storage
    .from('service-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function togglePopular(id: string, isPopular: boolean) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { error } = await supabase
    .from('services')
    .update({ is_popular: isPopular })
    .eq('id', id)
    .eq('business_id', businessId);

  if (error) {
    console.error('Error toggling popular status:', error);
    throw error;
  }

  revalidatePath('/services');
  revalidatePath('/booking');
  revalidatePath('/dashboard/services');
}

// Add-ons Management
export interface ServiceAddonData {
  id?: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number; // Additional time in minutes this add-on adds
  is_active?: boolean;
}

export async function getServiceAddons(serviceId: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Get addons for the specific service
  const { data: addons, error } = await supabase
    .from('service_addons')
    .select('*')
    .eq('business_id', businessId)
    .eq('service_id', serviceId) // Filter by service_id
    .order('name');

  if (error) throw error;
  return addons || [];
}

export async function saveServiceAddons(serviceId: string, addons: ServiceAddonData[]) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Verify service belongs to business
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('business_id', businessId)
    .single();

  if (!service) throw new Error('Service not found');

  // Note: service_addons table uses business_id, not service_id
  // Delete existing addons for this business (if you want service-specific, you'd need to filter differently)
  // For now, we'll just insert new ones - you may want to delete all business addons first
  // or implement a different strategy based on your needs

  // Delete existing addons for this service first
  await supabase
    .from('service_addons')
    .delete()
    .eq('service_id', serviceId)
    .eq('business_id', businessId);

  // Insert new addons with service_id
  if (addons.length > 0) {
    const addonsToInsert = addons.map(addon => ({
      business_id: businessId,
      service_id: serviceId, // Link add-ons to the specific service
      name: addon.name,
      description: addon.description || null,
      price: addon.price,
      duration_minutes: addon.duration_minutes || 0, // Store duration in minutes
      is_active: addon.is_active ?? true,
    }));

    const { error } = await supabase
      .from('service_addons')
      .insert(addonsToInsert);

    if (error) throw error;
  }

  revalidatePath('/services');
  revalidatePath(`/services/${serviceId}/edit`);
  revalidatePath('/booking');
}

export async function createServiceAddon(serviceId: string, addon: ServiceAddonData) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Verify service belongs to business
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('business_id', businessId)
    .single();

  if (!service) throw new Error('Service not found');

  const { data: newAddon, error } = await supabase
    .from('service_addons')
    .insert({
      business_id: businessId,
      service_id: serviceId, // Link add-on to the specific service
      name: addon.name,
      description: addon.description || null,
      price: addon.price,
      duration_minutes: addon.duration_minutes || 0, // Store duration in minutes
      is_active: addon.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/services');
  revalidatePath('/booking');
  return newAddon;
}

export async function updateServiceAddon(addonId: string, updates: ServiceAddonData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('service_addons')
    .update({
      name: updates.name,
      description: updates.description || null,
      price: updates.price,
      is_active: updates.is_active ?? true,
    })
    .eq('id', addonId);

  if (error) throw error;

  revalidatePath('/services');
  revalidatePath('/booking');
}

export async function deleteServiceAddon(addonId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('service_addons')
    .delete()
    .eq('id', addonId);

  if (error) throw error;

  revalidatePath('/services');
  revalidatePath('/booking');
}

// Get all add-ons for a business (both service-specific and business-wide)
export async function getAllAddons() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: addons, error } = await supabase
    .from('service_addons')
    .select(`
      *,
      service:services(id, name)
    `)
    .eq('business_id', businessId)
    .order('name');

  if (error) throw error;
  return addons || [];
}

// Create a business-wide add-on (service_id is null) or service-specific
export async function createAddon(addon: ServiceAddonData & { service_id?: string | null }) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: newAddon, error } = await supabase
    .from('service_addons')
    .insert({
      business_id: businessId,
      service_id: addon.service_id || null, // null for business-wide, or specific service_id
      name: addon.name,
      description: addon.description || null,
      price: addon.price,
      duration_minutes: addon.duration_minutes || 0,
      is_active: addon.is_active ?? true,
    })
    .select(`
      *,
      service:services(id, name)
    `)
    .single();

  if (error) throw error;

  revalidatePath('/dashboard/services');
  revalidatePath('/dashboard/services/add-ons');
  revalidatePath('/booking');
  return newAddon;
}

// Update any add-on
export async function updateAddon(addonId: string, updates: ServiceAddonData & { service_id?: string | null }) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Verify addon belongs to business
  const { data: existing } = await supabase
    .from('service_addons')
    .select('id')
    .eq('id', addonId)
    .eq('business_id', businessId)
    .single();

  if (!existing) throw new Error('Add-on not found');

  const updateData: any = {
    name: updates.name,
    description: updates.description || null,
    price: updates.price,
    duration_minutes: updates.duration_minutes || 0,
    is_active: updates.is_active ?? true,
  };

  // Only update service_id if provided
  if (updates.service_id !== undefined) {
    updateData.service_id = updates.service_id || null;
  }

  const { data: updated, error } = await supabase
    .from('service_addons')
    .update(updateData)
    .eq('id', addonId)
    .select(`
      *,
      service:services(id, name)
    `)
    .single();

  if (error) throw error;

  revalidatePath('/dashboard/services');
  revalidatePath('/dashboard/services/add-ons');
  revalidatePath('/booking');
  return updated;
}

// Delete any add-on
export async function deleteAddon(addonId: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Verify addon belongs to business
  const { data: existing } = await supabase
    .from('service_addons')
    .select('id')
    .eq('id', addonId)
    .eq('business_id', businessId)
    .single();

  if (!existing) throw new Error('Add-on not found');

  const { error } = await supabase
    .from('service_addons')
    .delete()
    .eq('id', addonId);

  if (error) throw error;

  revalidatePath('/dashboard/services');
  revalidatePath('/dashboard/services/add-ons');
  revalidatePath('/booking');
}
