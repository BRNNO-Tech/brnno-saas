# Worker/Technician Features Setup Guide

This document outlines the new high-priority features added to the worker/technician side of the application.

## Features Added

### 1. ✅ Calendar/Schedule View
- **Location**: `/worker/schedule`
- **Features**:
  - Monthly calendar view showing all assigned jobs
  - Visual timeline of scheduled jobs
  - Click on jobs to view details
  - Mobile-optimized responsive design
  - Navigation between months

### 2. ✅ Photo Upload Functionality
- **Location**: Job detail page (`/worker/jobs/[id]`)
- **Features**:
  - Upload before/after photos
  - Upload other job-related photos
  - Photo gallery with grid view
  - Delete photos
  - Photos stored in Supabase Storage

**Database Setup Required:**
```sql
-- Run this in Supabase SQL Editor
-- File: database/job_photos_migration.sql
```

**Storage Setup Required:**
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `job-photos`
3. Set bucket to public (or configure RLS policies)
4. Configure CORS if needed

### 3. ✅ Mobile Optimization
- **Features**:
  - Bottom navigation bar for mobile devices
  - Responsive sidebar for desktop
  - Touch-friendly buttons and interactions
  - Mobile-first layout improvements
  - Improved spacing and sizing for mobile screens

### 4. ✅ Enhanced Job Status Updates
- **New Status Options**:
  - "On My Way" - Worker is heading to the job location
  - "Arrived at Location" - Worker has arrived
  - "Start Job (Clock In)" - Begin work
  - "End Job (Clock Out)" - Finish work
  - "Mark as Complete" - Complete the job

**API Endpoint**: `/api/worker/update-status`

### 5. ✅ Route Optimization
- **Location**: `/worker/routes`
- **Features**:
  - View all jobs with addresses on a list
  - Get optimized route via Google Maps
  - Individual directions for each job
  - Jobs sorted by scheduled time
  - Location services integration

### 6. ⏳ Real-time Notifications (Future)
- This feature requires additional setup with Supabase Realtime or push notifications
- Can be implemented using:
  - Supabase Realtime subscriptions
  - Browser push notifications
  - WebSocket connections

## Database Migrations

### Required Migrations

1. **Job Photos Table**
   ```bash
   # Run in Supabase SQL Editor
   database/job_photos_migration.sql
   ```

2. **Storage Bucket**
   - Create `job-photos` bucket in Supabase Storage
   - Set appropriate RLS policies

## Navigation Structure

### Mobile (Bottom Navigation)
- Home (Dashboard)
- Schedule
- Routes
- Profile

### Desktop (Sidebar)
- Dashboard
- Schedule
- Routes
- Profile
- Sign Out

## API Endpoints

### Worker Status Updates
- **POST** `/api/worker/update-status`
  - Body: `{ assignmentId, jobId, status: 'on_my_way' | 'arrived' | 'in_progress' }`

### Photo Upload
- **Server Action**: `uploadJobPhoto(assignmentId, jobId, file, photoType, description?)`
- **Server Action**: `getJobPhotos(assignmentId)`
- **Server Action**: `deleteJobPhoto(photoId)`

## Usage Instructions

### For Workers

1. **View Schedule**
   - Navigate to "Schedule" from the navigation
   - See all assigned jobs in calendar view
   - Click on any job to view details

2. **Upload Photos**
   - Open a job detail page
   - Scroll to "Job Photos" section
   - Select photo type (Before/After/Other)
   - Click "Upload [type] Photo"
   - Select image file (max 10MB)
   - Photos will appear in the gallery

3. **Update Job Status**
   - On job detail page, use status buttons:
     - "On My Way" - When heading to location
     - "Arrived at Location" - When you arrive
     - "Start Job" - Begin work (clocks in)
     - "End Job" - Finish work (clocks out)
     - "Mark as Complete" - Complete the job

4. **Route Optimization**
   - Navigate to "Routes" from the navigation
   - View all jobs with addresses
   - Click "Get Optimized Route" to open Google Maps
   - Use individual "Directions" buttons for specific jobs

## Troubleshooting

### Photos Not Uploading
- Check that `job-photos` bucket exists in Supabase Storage
- Verify bucket is public or RLS policies allow uploads
- Check file size (max 10MB)
- Verify file is an image format

### Status Updates Not Working
- Check that worker is authenticated
- Verify assignment belongs to the worker
- Check browser console for errors

### Route Optimization Not Working
- Ensure jobs have valid addresses
- Check that location services are enabled
- Verify Google Maps is accessible

## Next Steps

1. Run database migrations
2. Set up Supabase Storage bucket
3. Test photo uploads
4. Test status updates
5. Test route optimization
6. Consider adding real-time notifications (optional)

