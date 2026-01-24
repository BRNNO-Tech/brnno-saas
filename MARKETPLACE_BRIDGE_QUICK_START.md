# Firebase Sync - Quick Start & Troubleshooting

## ✅ Step-by-Step Setup Checklist

### 1. Verify Edge Function is Deployed

- ✅ Go to: <https://supabase.com/dashboard/project/kvlsqzmvuaehqhjkskch/functions>
- ✅ You should see `sync-to-firebase` in the list
- ✅ Click on it to view details

### 2. Set Edge Function Secrets (CRITICAL)

1. Go to: <https://supabase.com/dashboard/project/kvlsqzmvuaehqhjkskch/functions/sync-to-firebase>
2. Click on **Settings** or **Secrets** tab
3. Add these two secrets:

   **Secret 1:**
   - Name: `FIREBASE_PROJECT_ID`
   - Value: Your Firebase project ID (e.g., `my-firebase-project-12345`)
   - Click **Add Secret**

   **Secret 2:**
   - Name: `FIREBASE_API_KEY`
   - Value: Your Firebase Web API Key (from Firebase Console > Project Settings > General)
   - Click **Add Secret**

**Where to find Firebase credentials:**

1. Go to <https://console.firebase.google.com>
2. Select your project
3. Click the gear icon ⚙️ > **Project Settings**
4. **General** tab:
   - **Project ID** = `FIREBASE_PROJECT_ID`
   - Scroll down to **Your apps** section
   - If you have a web app, the **API Key** is shown there
   - If not, click **Add app** > Web (</>) to create one and get the API key

### 3. Clean Up Old Triggers (IMPORTANT - Do This First!)

**If you see an error about trigger "sync-provider-to-firestore" already existing:**

1. Go to: <https://supabase.com/dashboard/project/kvlsqzmvuaehqhjkskch/sql/new>
2. Run this SQL to remove the old trigger:

   ```sql
   -- Drop the existing trigger
   DROP TRIGGER IF EXISTS "sync-provider-to-firestore" ON auth.users;
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP TRIGGER IF EXISTS sync_to_firebase_trigger ON auth.users;
   ```

3. Or use the cleanup script: `database/cleanup_old_trigger.sql`

### 4. Set Up Database Webhook

1. Go to: <https://supabase.com/dashboard/project/kvlsqzmvuaehqhjkskch/database/webhooks>
2. **Delete any existing webhooks** for `auth.users` if you created them incorrectly
3. Click **Create a new webhook**
4. Fill in:

   **Basic Info:**
   - **Name**: `Sync to Firebase`
   - **Table**: Select `auth.users` from dropdown
   - **Events**: Check ONLY `INSERT` (uncheck UPDATE, DELETE)

   **HTTP Request:**
   - **HTTP Request URL**: `https://kvlsqzmvuaehqhjkskch.supabase.co/functions/v1/sync-to-firebase`
   - **HTTP Method**: `POST`

   **HTTP Headers** (click "Add Header" for each):
   - Header 1:
     - Name: `Content-Type`
     - Value: `application/json`
   - Header 2:
     - Name: `Authorization`
     - Value: `Bearer YOUR_SERVICE_ROLE_KEY`
     - (Get service role key from: Settings > API > service_role key)

   **HTTP Request Body:**
   - Paste this EXACTLY:

   ```json
   {
     "record": {
       "id": "{{ $1.id }}",
       "email": "{{ $1.email }}",
       "phone": "{{ $1.phone }}",
       "created_at": "{{ $1.created_at }}",
       "raw_user_meta_data": {{ $1.raw_user_meta_data }}
     }
   }
   ```

5. Click **Save**

### 5. Test the Sync

**Option A: Create a Test User**

1. Go to your app's signup page
2. Create a new test user
3. Check Edge Function logs:
   - Go to: <https://supabase.com/dashboard/project/kvlsqzmvuaehqhjkskch/functions/sync-to-firebase>
   - Click **Logs** tab
   - You should see logs showing the function was called

**Option B: Test Manually**

1. Go to Supabase Dashboard > Authentication > Users
2. Click **Add user** > **Create new user**
3. Enter test email and password
4. Check Edge Function logs immediately

### 6. Verify in Firebase

1. Go to Firebase Console > Firestore Database
2. Navigate to `/users/{userId}` (use the Supabase user ID)
3. You should see:
   - `email`: user's email
   - `user_type`: "client"
   - `saas_enabled`: true
   - `supabase_user_id`: the Supabase user ID
   - `name`, `phone`, etc.

## 🔍 Troubleshooting

### Edge Function Not Being Called

**Check Webhook:**

1. Go to Database > Webhooks
2. Click on your webhook
3. Check **Recent deliveries** tab
4. Look for any failed requests
5. Check the error message

**Common Issues:**

- ❌ Wrong URL → Should be: `https://kvlsqzmvuaehqhjkskch.supabase.co/functions/v1/sync-to-firebase`
- ❌ Missing Authorization header → Add it with service_role key
- ❌ Wrong table → Must be `auth.users`
- ❌ Wrong events → Should only be `INSERT`

### Edge Function Called But Failing

**Check Edge Function Logs:**

1. Go to Functions > sync-to-firebase > Logs
2. Look for error messages

**Common Errors:**

**"Firebase not configured"**

- ✅ Secrets not set → Go to Function Settings and add `FIREBASE_PROJECT_ID` and `FIREBASE_API_KEY`

**"Failed to sync to Firebase"**

- ✅ Check Firebase API is enabled
- ✅ Verify Firestore rules allow writes
- ✅ Check if API key is correct
- ✅ Verify project ID is correct

**"Invalid record data"**

- ✅ Webhook body format is wrong
- ✅ Check webhook body matches the template exactly

### Firebase Not Receiving Data

**Check Firestore Rules:**

1. Go to Firebase Console > Firestore Database > Rules
2. Make sure writes are allowed (at least temporarily for testing):

   ```javascript
   match /users/{userId} {
     allow write: if true; // Temporary - change later
     allow read: if request.auth != null && request.auth.uid == userId;
   }
   ```

**Check API is Enabled:**

1. Go to Google Cloud Console
2. Enable Firestore API if not already enabled

## 🧪 Quick Test Script

Test the Edge Function directly:

```bash
# Replace with actual values
curl -X POST https://kvlsqzmvuaehqhjkskch.supabase.co/functions/v1/sync-to-firebase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "record": {
      "id": "test-user-123",
      "email": "test@example.com",
      "phone": null,
      "created_at": "2024-01-13T00:00:00Z",
      "raw_user_meta_data": {
        "full_name": "Test User"
      }
    }
  }'
```

This should return:

```json
{
  "message": "Client synced to Firebase",
  "userId": "test-user-123",
  "email": "test@example.com"
}
```

## 📋 Complete Checklist

- [ ] Edge Function deployed (`sync-to-firebase`)
- [ ] `FIREBASE_PROJECT_ID` secret set in Edge Function
- [ ] `FIREBASE_API_KEY` secret set in Edge Function
- [ ] Database webhook created for `auth.users` table
- [ ] Webhook URL is correct
- [ ] Webhook has `Content-Type` header
- [ ] Webhook has `Authorization` header with service_role key
- [ ] Webhook body matches template exactly
- [ ] Webhook listens to `INSERT` events only
- [ ] Firestore rules allow writes
- [ ] Firebase API is enabled

## 🆘 Still Not Working?

1. **Check Edge Function logs** - Most detailed error info
2. **Check Webhook deliveries** - See if webhook is being triggered
3. **Test Edge Function directly** - Use curl command above
4. **Verify Firebase credentials** - Double-check project ID and API key
5. **Check Firestore rules** - Make sure writes are allowed
