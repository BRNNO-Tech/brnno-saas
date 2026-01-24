# Supabase Storage Buckets Setup

This application requires the following storage buckets to be created in your Supabase project:

## Required Buckets

1. **`booking-photos`** - Stores photos uploaded by customers during booking (for AI analysis)
2. **`job-photos`** - Stores photos uploaded by workers during job completion
3. **`business-logos`** - Stores business logo images
4. **`booking-banners`** - Stores custom booking page banner images

## Setup Instructions

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Create each bucket with the following settings:

#### For `business-logos`:
- **Name**: `business-logos`
- **Public bucket**: ✅ Checked (so logos can be accessed publicly)
- **File size limit**: 10 MB (or your preferred limit)
- **Allowed MIME types**: `image/*` (or leave empty for all types)

#### For `booking-photos`:
- **Name**: `booking-photos`
- **Public bucket**: ✅ Checked (so photos can be accessed publicly)
- **File size limit**: 10 MB (or your preferred limit)
- **Allowed MIME types**: `image/*` (or leave empty for all types)

#### For `job-photos`:
- **Name**: `job-photos`
- **Public bucket**: ✅ Checked (so photos can be accessed publicly)
- **File size limit**: 10 MB (or your preferred limit)
- **Allowed MIME types**: `image/*` (or leave empty for all types)

#### For `booking-banners`:
- **Name**: `booking-banners`
- **Public bucket**: ✅ Checked (so banners can be accessed publicly)
- **File size limit**: 10 MB (or your preferred limit)
- **Allowed MIME types**: `image/*` (or leave empty for all types)

### Option 2: Using SQL (Supabase SQL Editor) - RECOMMENDED

**Easiest method:** Run the migration file `database/create_storage_buckets.sql` in your Supabase SQL Editor. This creates all buckets and sets up proper RLS policies.

Or manually run:

```sql
-- Create booking-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-photos',
  'booking-photos',
  true,
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create job-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  true,
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create business-logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-logos',
  'business-logos',
  true,
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create booking-banners bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-banners',
  'booking-banners',
  true,
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

### Option 3: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Create booking-photos bucket
supabase storage create booking-photos --public

# Create job-photos bucket
supabase storage create job-photos --public

# Create business-logos bucket
supabase storage create business-logos --public

# Create booking-banners bucket
supabase storage create booking-banners --public
```

## Storage Policies (RLS)

If you're using Row Level Security (RLS), you may need to set up policies. For public buckets, you typically want:

1. **Allow public read access** - So images can be displayed on booking pages
2. **Allow authenticated users to upload** - So business owners can upload their logos/banners

You can set these up in the Supabase dashboard under **Storage** → **Policies** for each bucket.

## Verification

After creating the buckets, try uploading a logo or banner in the dashboard settings. The upload should work without the "Bucket not found" error.
