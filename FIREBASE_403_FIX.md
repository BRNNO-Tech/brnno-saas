# Fixing Firebase 403 "Missing or insufficient permissions" Error

## The Problem

You're seeing this error:
```
Firebase sync error: { "error": { "code": 403, "message": "Missing or insufficient permissions..." }
```

This means:
- ✅ Your webhook is working (Edge Function is being called)
- ✅ Your Edge Function is trying to write to Firebase
- ❌ Firebase is blocking the write due to permissions

## Solution 1: Fix Firestore Security Rules (MOST COMMON FIX)

The Firestore security rules are likely blocking writes from the REST API.

### Steps:

1. **Go to Firebase Console:**
   - https://console.firebase.google.com
   - Select your project
   - Go to **Firestore Database** > **Rules** tab

2. **Update the rules** to allow writes (temporarily for testing):

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow writes to users collection (temporary - for testing)
       match /users/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if true; // TEMPORARY - allows all writes
       }
       
       // Your other rules...
     }
   }
   ```

3. **Click "Publish"** to save the rules

4. **Test again** - Create a new test user and check if it syncs

### After Testing Works:

Once you confirm it's working, you should update the rules to be more secure:

```javascript
match /users/{userId} {
   // Allow users to read their own data
   allow read: if request.auth != null && request.auth.uid == userId;
   
   // Allow writes from your Supabase Edge Function
   // You can add additional checks here if needed
   allow write: if true; // Or add specific conditions
}
```

## Solution 2: Verify Firebase API Key Permissions

The API key might not have the right permissions.

### Steps:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com
   - Select your Firebase project

2. **Go to APIs & Services > Credentials:**
   - Find your API key (the one you're using as `FIREBASE_API_KEY`)
   - Click on it to edit

3. **Check API restrictions:**
   - Make sure **Cloud Firestore API** is enabled
   - Or set it to "Don't restrict" (for testing)

4. **Check Application restrictions:**
   - For testing, you can set it to "None"
   - Or add your Supabase Edge Function domain if needed

## Solution 3: Verify Firebase Project ID and API Key

Double-check that your secrets are correct:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/kvlsqzmvuaehqhjkskch/functions/sync-to-firebase
   - Click **Settings** or **Secrets**

2. **Verify `FIREBASE_PROJECT_ID`:**
   - Should match your Firebase project ID exactly
   - Find it in: Firebase Console > Project Settings > General > Project ID

3. **Verify `FIREBASE_API_KEY`:**
   - Should be your Firebase Web API Key
   - Find it in: Firebase Console > Project Settings > General > Your apps > Web app > API Key

4. **If incorrect, update them:**
   - Delete the old secret
   - Add the new secret with correct value
   - The Edge Function will automatically use the new values

## Solution 4: Enable Firestore API

Make sure the Firestore API is enabled:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/library
   - Search for "Cloud Firestore API"
   - Click on it
   - Make sure it's **Enabled**

## Quick Test After Fixing

1. **Create a test user:**
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add user" > "Create new user"
   - Enter test email and password

2. **Check Edge Function logs:**
   - Go to: https://supabase.com/dashboard/project/kvlsqzmvuaehqhjkskch/functions/sync-to-firebase
   - Click **Logs** tab
   - Should see: "Successfully synced user {userId} to Firebase"

3. **Check Firebase:**
   - Go to Firebase Console > Firestore Database
   - Navigate to `/users/{userId}`
   - Should see the user document

## Most Likely Fix

**99% of the time, it's Solution 1 (Firestore Security Rules).**

The Firestore rules are blocking writes. Update them to allow writes temporarily, test, then secure them properly.
