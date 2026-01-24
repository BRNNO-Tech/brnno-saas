import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") || ""
const FIREBASE_API_KEY = Deno.env.get("FIREBASE_API_KEY") || ""

serve(async (req) => {
  try {
    const { record } = await req.json()

    if (!record || !record.id || !record.email) {
      return new Response(
        JSON.stringify({ error: "Invalid record data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
      console.error("Firebase credentials not configured")
      return new Response(
        JSON.stringify({ error: "Firebase not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Prepare Firestore document data
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${record.id}?key=${FIREBASE_API_KEY}`

    // Format timestamp for Firestore (RFC3339 format)
    const now = new Date()
    const timestampValue = now.toISOString().replace('Z', '') + 'Z'

    const profileData = {
      fields: {
        email: { stringValue: record.email },
        user_type: { stringValue: "client" }, // Hardcoded as 'client' for Supabase signups
        saas_enabled: { booleanValue: true },
        created_at: { timestampValue: timestampValue },
        supabase_user_id: { stringValue: record.id },
        name: record.raw_user_meta_data?.full_name 
          ? { stringValue: record.raw_user_meta_data.full_name }
          : { stringValue: record.email },
        phone: record.phone 
          ? { stringValue: record.phone }
          : { nullValue: null },
        ...(record.raw_user_meta_data?.marketplace_user_id && {
          marketplace_user_id: { stringValue: record.raw_user_meta_data.marketplace_user_id }
        })
      }
    }

    console.log('Syncing user to Firebase:', {
      userId: record.id,
      email: record.email,
      firebaseProject: FIREBASE_PROJECT_ID
    })

    // Sync to Firestore
    const response = await fetch(firestoreUrl, {
      method: 'PATCH', // PATCH allows creating or updating
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Firebase sync error:", errorText)
      return new Response(
        JSON.stringify({ error: "Failed to sync to Firebase", details: errorText }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(`Successfully synced user ${record.id} to Firebase`)

    return new Response(
      JSON.stringify({ 
        message: "Client synced to Firebase",
        userId: record.id,
        email: record.email
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Error in sync-to-firebase:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
