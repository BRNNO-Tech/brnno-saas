# Leads Feature Restructure - Complete Implementation Plan

## Overview

Transform the Leads feature into a premium, tier-gated system that serves as a top selling point. This document outlines the complete structure, components, and implementation phases.

---

## 1. Navigation Structure

### Left Sidebar Navigation

```
Overview              → /dashboard/leads (Overview Dashboard)
LEAD RECOVERY
  ├─ Leads Inbox     → /dashboard/leads/inbox (3-panel command center)
  ├─ Sequences       → /dashboard/leads/sequences (Recovery playbooks)
  ├─ Scripts         → /dashboard/leads/scripts (Template library)
  └─ Reports         → /dashboard/leads/reports (ROI & analytics)

CUSTOMERS
  ├─ Customers       → /dashboard/customers
  └─ Jobs            → /dashboard/jobs

BUSINESS
  ├─ Services        → /dashboard/services
  ├─ Calendar        → /dashboard/schedule
  └─ Reviews         → /dashboard/reviews

Settings              → /dashboard/settings
  ├─ Brand           → /dashboard/settings/brand
  ├─ Channels        → /dashboard/settings/channels (SMS/Email)
  ├─ Business Hours  → /dashboard/settings/hours
  ├─ Team & Permissions → /dashboard/settings/team
  └─ Integrations    → /dashboard/settings/integrations
```

### Tier Gating Strategy

- **Starter (`limited_lead_recovery`)**:
  - Can access Overview page (limited view with upgrade prompts)
  - Max 20 leads
  - No access to Inbox, Sequences, Scripts, Reports
  
- **Pro/Fleet (`lead_recovery_dashboard`)**:
  - Full access to all lead recovery features
  - Unlimited leads
  - Full dashboard with all features

---

## 2. Global Top Bar (All Pages)

**Components:**

- **Search**: "Search leads, phone, tags…"
- **Date Range Selector**: Today / 7d / 30d / Custom
- **Quick Action Button**: "+ Add Lead"
- **Notifications Icon**: Shows failures / replies / bookings

**Location**: `app/dashboard/layout.tsx` - Topbar component

---

## 3. Overview Dashboard (`/dashboard/leads`)

**Purpose**: Recovery Command Center - track recovered revenue, at-risk leads, and next actions

### Header

- **Title**: "Recovery Command Center"
- **Subtext**: "Track recovered revenue, at-risk leads, and what to do next."

### KPI Row (5 Cards)

1. **Recovered Revenue** (biggest card)
   - Main: `$3,420`
   - Sub: `+18% vs last 30 days`
   - Click → Filter + jump to Inbox

2. **Bookings From Recovery**
   - Main: `26`
   - Click → Filter booked leads

3. **At-Risk Leads**
   - Main: `14` (red/orange accent)
   - Click → Filter at-risk leads

4. **Speed-to-Lead**
   - Main: `38s median`
   - Click → Show speed distribution

5. **Reply Rate**
   - Main: `44%`
   - Click → Show reply analytics

### "Do This Now" Panel (High Conversion)

**Card Title**: "Next Best Actions"

**Dynamic Items:**

- "5 leads are hot — reply now" → Button: "Open Queue"
- "3 leads need an incentive" → Button: "Open Queue"
- "2 missed calls need a callback" → Button: "Open Queue"

Each item is actionable with one-click access.

### At-Risk Leads Table (Mini Inbox)

**Columns:**

- Lead (name + phone)
- Service
- Last Touch
- Score
- Recommended action (AI-generated)
- Quick actions: Text / Call / Email

**Row Action**: Opens Lead Detail drawer or navigates to full page

### Insights Cards (Right Side or Below)

**Cards:**

- "Best time to text: 6–8pm"
- "Top script: 'Quick lock-in'"
- "Most lost stage: after quote"

---

## 4. Leads Inbox (`/dashboard/leads/inbox`)

**The Money Page** - Make it feel like a trading terminal

### Layout: 3-Panel Command Center

```
┌─────────────┬──────────────────┬─────────────────────┐
│   Left      │     Center       │       Right         │
│  Filters    │   Lead List      │  Lead Detail        │
│  + Views    │   (fast scan)    │  + Timeline        │
│             │                  │  + AI Composer     │
└─────────────┴──────────────────┴─────────────────────┘
```

### Left Panel: Filters + Views

**Saved Views (Tabs):**

- New (unreplied)
- At-Risk
- Engaged
- Booked
- Lost
- Do Not Contact

**Filters:**

- Status dropdown
- Source (FB / Web / Call / Import)
- Service interest (Interior, Full, Ceramic, etc.)
- Vehicle type
- Lead score range (slider: 0-100)
- Last touch (today / 24h / 7d)
- Tags (multi-select)

**Smart Filter Buttons:**

- "Needs Reply"
- "Clicked Booking Link"
- "Quote Sent, No Response"
- "Missed Call"

### Center Panel: Lead List (Fast Scanning)

**Row Display:**

- Name + phone (small)
- Service requested
- Vehicle (if known)
- Lead score badge (0–100)
- Last touch time ("2h ago")
- Channel icons (SMS/email/call activity)
- Tiny "heat" dot: 🔴 hot / 🟠 warm / 🔵 cold

**Row States:**

- **New**: Subtle "unread" glow
- **At-Risk**: Orange border left
- **Hot**: Bright accent dot
- **DNC**: Muted + lock icon

**Interaction**: Click row → Opens right panel detail

### Right Panel: Lead Detail (The Closer)

**Top Section:**

- Name / phone / vehicle / zip
- Status dropdown (New, Engaged, Booked, Lost, DNC)
- Lead score pill (0-100)

**Tabs Inside Panel:**

1. **Timeline** (default)
2. **Notes**
3. **Quote/Estimate**
4. **Booking**

#### Timeline Tab (Vertical)

**Event Cards:**

- Lead created
- Auto-SMS sent (status: delivered/read)
- Customer reply
- AI message sent
- Booking link clicked
- Booked

**Each Message Shows:**

- Channel icon (SMS/Email/Call)
- Timestamp
- Delivery state (sent/delivered/read/failed)

#### AI Composer (Sticky at Bottom)

**Components:**

- Text input area (multi-line)
- Primary CTA: "Send"
- Action Buttons:
  - "AI Suggest Reply"
  - "Offer Incentive"
  - "Ask 2 Questions"
  - "Send Booking Link"
- Tone Toggle: "Human tone / Premium tone / Direct tone"
- Mini disclaimer: "Always short. Always book-forward."

**AI Suggest Reply Flow:**

1. User clicks "AI Suggest Reply"
2. Generates 2-3 options:
   - "Fast close"
   - "Friendly"
   - "Premium"
3. One-click insert into input
4. User can edit before sending

---

## 5. Lead Detail Full Page (`/dashboard/leads/[id]`)

**Deep View** - Full page in addition to drawer

### Header

- Lead name + score
- Status control
- Action buttons: Call, Text, Email, Send Booking, Mark Booked

### Sections

**Left Column:**

- Timeline + Conversation thread (full view)

**Right Column:**

- Lead info card (service, vehicle, budget, source)
- "AI Insights" card:
  - Objection detected: "price"
  - Suggested response
  - Recommended next step: "Offer tire shine upgrade"

---

## 6. Sequences Builder (`/dashboard/leads/sequences`)

### Sequences List Page

**Each Sequence Card Shows:**

- Name
- Active enrollments count
- Conversion rate
- Last edited date
- Toggle on/off

**Actions:**

- "Create Sequence" button
- "Duplicate" button
- "Edit" button

### Sequence Editor Page (Visual Flow Builder)

**Flow Builder:**

```
Trigger → Step → Condition → Next Step
```

**Step Types:**

- Send SMS
- Send Email
- Wait X minutes/hours/days
- If replied
- If clicked booking
- If no reply
- Add tag
- Change status
- Notify user (Slack/email)

**Right-Side Step Editor:**

When step selected:

- Message template picker
- Personalization tokens:
  - `{first_name}`
  - `{vehicle}`
  - `{service}`
  - `{booking_link}`
- Business hours respect toggle
- "Stop if replied" toggle

---

## 7. Scripts Library (`/dashboard/leads/scripts`)

### Layout

**Left**: Script categories
**Center**: Script list
**Right**: Editor + performance

### Categories

- New lead instant reply
- Quote follow-up
- Missed call text-back
- Shopping around
- Incentive offer
- Break-up message
- Reactivation

### Script Editor

**Fields:**

- Name
- Channel (SMS/Email)
- Body with tokens
- Tone tags (Friendly/Premium/Direct)
- CTA style: booking link vs question

### Performance Panel

**Metrics:**

- Reply rate
- Booking rate
- Avg time to book
- A/B test toggle (variant A/B)

---

## 8. Reports Page (`/dashboard/leads/reports`)

### Hero Card

- **Recovered Revenue (30d)** - big number
- Sub: "This is money you would've lost."

### Charts

1. **Recovered revenue over time** (line chart)
2. **Conversion by channel** (SMS vs Email) - bar chart
3. **Speed-to-lead distribution** (histogram)
4. **Funnel**: Lead → Replied → Engaged → Booked

### Table

**"Top Sequences by ROI"**

Columns:

- Sequence name
- Enrollments
- Bookings
- Recovered $

---

## 9. Settings Restructure (`/dashboard/settings`)

### Brand Page (`/dashboard/settings/brand`)

**Fields:**

- Logo upload
- Brand name
- Accent color picker
- Outbound sender name
- Tone defaults

### Business Hours (`/dashboard/settings/hours`)

**Features:**

- Set hours (day-by-day)
- "Don't text after hours" toggle
- "If lead arrives after hours, send at 8am" toggle

### Channels (`/dashboard/settings/channels`)

**SMS:**

- Twilio connect (status indicator)
- Test message button

**Email:**

- Email provider connect
- Test email button

### Team & Permissions (`/dashboard/settings/team`)

- Team member management
- Role assignments
- Permissions matrix

### Integrations (`/dashboard/settings/integrations`)

- Third-party integrations
- API keys
- Webhook endpoints

---

## 10. Reusable Components (Dev Checklist)

### Core Components

- [ ] `KpiCard` - Reusable KPI card with trend
- [ ] `TrendBadge` - Shows +18% vs last period
- [ ] `LeadScorePill` - 0-100 score display
- [ ] `StatusDropdown` - Lead status selector
- [ ] `SmartFilterChips` - Quick filter buttons
- [ ] `LeadListRow` - Optimized row component
- [ ] `TimelineEventCard` - Event in timeline
- [ ] `ConversationBubble` - Message bubble
- [ ] `MessageComposer` - AI composer with suggestions
- [ ] `AiSuggestionPanel` - AI reply options
- [ ] `SequenceFlowCanvas` - Visual flow builder
- [ ] `StepEditorDrawer` - Step configuration
- [ ] `ScriptEditor` - Script template editor
- [ ] `PerformanceMiniChart` - Small performance chart
- [ ] `EmptyStateCard` - Empty states
- [ ] `IntegrationStatusChip` - Connection status

### "Elite" Micro-interactions

- [ ] Hover: row glow + quick actions appear
- [ ] Loading: skeletons (not spinners)
- [ ] AI generation: small "typing" shimmer
- [ ] Success: subtle confetti only on "Booked" (optional)

---

## 11. Empty States (Premium Feel)

### No Leads Yet

**Headline**: "Your recovery engine is ready."
**Body**: "Import leads or connect a source to start recovering bookings automatically."
**Buttons**:

- "Connect FB Leads"
- "Import CSV"
- "Add Lead"

### Sequence Off

**Headline**: "Recovery is paused."
**Body**: "Turn on a sequence to start contacting leads automatically."

---

## 12. Implementation Phases

### Phase 1: Navigation & Routing ✅ (In Progress)

- [x] Update navigation structure
- [ ] Create new page routes
- [ ] Add tier-based gating logic
- [ ] Update Topbar with search, date range, notifications

### Phase 2: Overview Dashboard

- [ ] Create KPI cards component
- [ ] Build "Do This Now" panel
- [ ] Create At-Risk Leads table
- [ ] Add Insights cards
- [ ] Implement click-to-filter functionality

### Phase 3: Leads Inbox (3-Panel)

- [ ] Create 3-panel layout component
- [ ] Build left filters panel
- [ ] Create optimized lead list
- [ ] Build right detail drawer
- [ ] Implement AI Composer
- [ ] Add timeline component

### Phase 4: Sequences Builder

- [ ] Create sequences list page
- [ ] Build visual flow builder
- [ ] Create step editor
- [ ] Implement sequence logic

### Phase 5: Scripts Library

- [ ] Create scripts list
- [ ] Build script editor
- [ ] Add performance tracking
- [ ] Implement A/B testing

### Phase 6: Reports Page

- [ ] Create revenue charts
- [ ] Build conversion funnels
- [ ] Add top sequences table
- [ ] Implement date range filtering

### Phase 7: Settings Restructure

- [ ] Create Brand settings page
- [ ] Build Channels settings
- [ ] Create Business Hours page
- [ ] Add Team & Permissions
- [ ] Build Integrations page

### Phase 8: Global Top Bar

- [ ] Add search component
- [ ] Create date range selector
- [ ] Add quick action button
- [ ] Build notifications icon

---

## 13. Technical Requirements

### Database

- Ensure `service_addons` table has `service_id` column
- Verify RLS policies for lead recovery features
- Check tier/subscription tracking

### API Endpoints Needed

- `/api/leads/search` - Search leads
- `/api/leads/ai-suggest` - AI reply suggestions
- `/api/sequences` - Sequence CRUD
- `/api/scripts` - Script CRUD
- `/api/leads/stats` - KPI data

### Permissions

- `limited_lead_recovery` - Starter tier
- `lead_recovery_dashboard` - Pro/Fleet tier
- `full_automation` - Pro/Fleet tier

---

## 14. UI/UX Principles

### Premium Feel

- Fast, responsive interactions
- Skeleton loaders (not spinners)
- Smooth transitions
- Micro-interactions on key actions
- Professional color scheme
- Clear hierarchy

### Performance

- Optimize lead list rendering (virtualization if needed)
- Lazy load timeline events
- Cache KPI data
- Debounce search inputs

### Accessibility

- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

---

## 15. Testing Checklist

### Overview Dashboard

- [ ] KPI cards calculate correctly
- [ ] Click filters work
- [ ] "Do This Now" shows correct counts
- [ ] At-Risk table displays correctly

### Leads Inbox

- [ ] 3-panel layout responsive
- [ ] Filters apply correctly
- [ ] Lead list scrolls smoothly
- [ ] Detail drawer opens/closes
- [ ] AI Composer generates suggestions
- [ ] Messages send successfully

### Sequences

- [ ] Flow builder works
- [ ] Steps save correctly
- [ ] Sequences trigger correctly
- [ ] Business hours respected

### Scripts

- [ ] Scripts save/load
- [ ] Performance tracks
- [ ] A/B testing works

### Tier Gating

- [ ] Starter sees upgrade prompts
- [ ] Pro+ sees full features
- [ ] Navigation hides locked items

---

## Next Steps

1. **Review this plan** - Confirm structure matches vision
2. **Prioritize phases** - Decide what to build first
3. **Create component library** - Build reusable components
4. **Implement incrementally** - One phase at a time
5. **Test thoroughly** - Ensure tier gating works correctly

---

**Last Updated**: [Current Date]
**Status**: Planning Phase
