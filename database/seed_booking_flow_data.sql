-- Update existing services with full details
update services set
  description = 'Perfect for regular maintenance. Quick wash, vacuum, and windows.',
  whats_included = '["Exterior hand wash", "Vacuum interior", "Windows inside & out", "Tire shine", "Basic wipe down"]'::jsonb,
  estimated_duration = 60,
  is_popular = false
where name ilike '%basic%';

update services set
  description = 'Our most popular choice! Complete interior and exterior detail.',
  whats_included = '["Everything in Basic", "Deep interior cleaning", "Leather conditioning", "Dashboard & console detail", "Door jambs", "Wax & polish"]'::jsonb,
  estimated_duration = 150,
  is_popular = true
where name ilike '%full%';

update services set
  description = 'The ultimate detail with ceramic coating and engine bay.',
  whats_included = '["Everything in Full Detail", "Ceramic coating (6-month)", "Engine bay detail", "Headlight restoration", "Trim restoration"]'::jsonb,
  estimated_duration = 240,
  is_popular = false
where name ilike '%premium%';

-- Add sample addons for ALL businesses
-- This will create add-ons for every business in the database
insert into service_addons (business_id, name, description, price, icon, sort_order, is_active)
select 
  b.id as business_id,
  t.name,
  t.description,
  t.price,
  t.icon,
  t.sort_order,
  true as is_active
from businesses b
cross join (
  values
    ('Pet Hair Removal', 'Remove embedded pet hair from seats and carpet', 25.00, '🐾', 1),
    ('Odor Elimination', 'Eliminate smoke, food, or pet odors', 30.00, '🚭', 2),
    ('Ceramic Coating', '6-month protection with incredible shine', 100.00, '💎', 3),
    ('Engine Bay Detail', 'Clean and degrease engine compartment', 40.00, '🔧', 4),
    ('Headlight Restoration', 'Restore cloudy headlights to like-new', 50.00, '💡', 5),
    ('Clay Bar Treatment', 'Remove contaminants for ultra-smooth finish', 35.00, '✨', 6)
) as t(name, description, price, icon, sort_order)
where not exists (
  -- Only insert if this business doesn't already have this addon
  select 1 from service_addons sa 
  where sa.business_id = b.id 
  and sa.name = t.name
);
