// Common add-ons that can be pre-populated for any service

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

export const COMMON_ADDONS: Omit<ServiceAddon, 'id' | 'service_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Engine Bay Detail',
    description: 'Deep clean and dressing of engine compartment',
    price: 50,
    is_active: true,
  },
  {
    name: 'Pet Hair Removal',
    description: 'Specialized removal of pet hair from interior',
    price: 30,
    is_active: true,
  },
  {
    name: 'Headlight Restoration',
    description: 'Remove oxidation and restore clarity',
    price: 75,
    is_active: true,
  },
  {
    name: 'Clay Bar Treatment',
    description: 'Remove embedded contaminants from paint',
    price: 40,
    is_active: true,
  },
  {
    name: 'Ceramic Coating',
    description: 'Long-lasting paint protection (6 months+)',
    price: 200,
    is_active: true,
  },
  {
    name: 'Odor Elimination',
    description: 'Ozone treatment or deep cleaning for odors',
    price: 60,
    is_active: true,
  },
  {
    name: 'Paint Correction',
    description: 'Remove swirls and scratches (light)',
    price: 150,
    is_active: true,
  },
  {
    name: 'Leather Conditioning',
    description: 'Deep conditioning treatment for leather seats',
    price: 45,
    is_active: true,
  },
  {
    name: 'Tire Shine',
    description: 'Premium tire dressing application',
    price: 15,
    is_active: true,
  },
  {
    name: 'Stain Removal',
    description: 'Specialized treatment for tough stains',
    price: 35,
    is_active: true,
  },
  {
    name: 'Undercarriage Wash',
    description: 'Thorough cleaning of vehicle underside',
    price: 25,
    is_active: true,
  },
  {
    name: 'Convertible Top Treatment',
    description: 'Cleaning and protection for fabric tops',
    price: 55,
    is_active: true,
  },
];
