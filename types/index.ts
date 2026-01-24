export interface Service {
  id: string;
  user_id?: string; // Optional for backward compatibility
  business_id?: string; // Optional for backward compatibility
  name: string;
  description?: string;
  base_price: number;
  price?: number; // Legacy field for backward compatibility
  base_duration?: number; // Base duration in minutes
  estimated_duration?: number; // in minutes (legacy, use base_duration)
  duration_minutes?: number; // Legacy field for backward compatibility
  pricing_model?: 'flat' | 'variable'; // Pricing model type
  variations?: Record<string, { price: number; duration: number; enabled: boolean }>; // Vehicle size variations
  icon?: string; // emoji
  image_url?: string;
  is_popular: boolean;
  whats_included?: string[]; // JSONB array
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// For add-ons
export interface ServiceAddon {
  id?: string;
  service_id?: string;
  name: string;
  description?: string;
  price: number;
  duration?: number; // Duration in minutes (optional)
  duration_minutes?: number; // Alternative field name for duration (optional)
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
