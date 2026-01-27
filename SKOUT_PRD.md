# SKOUT - College Recruiting Platform PRD

## Product Overview
SKOUT is a mobile app that helps high school athletes find and contact college coaches. It has two core part: Discovery (Find coaches) and Messaging (Automated outreach).

## Core Features (Must Build These 5)
1. **Search** - User enters school + sport → API call → Display up to 15 coaches
2. **Save Coaches** - User taps "+" on any coach → Saves to Supabase coaches table
3. **All Contacts** - Display user's saved coaches from Supabase (filtered by user_id)
4. **Coach Detail** - Tap any coach to see full contact card (email, phone, Twitter)
5. **Templates** - Pre-made message templates with variable substitution and channel selection

## Technical Stack
- **Frontend:** React Native (Expo) with Expo Router
- **Backend:** FastAPI (already built, running at localhost:8000)
- **Database:** Supabase (PostgreSQL + Auth)
- **Auth:** Supabase Auth (uses auth.users table)

---

## Backend API Contract

### Endpoint: Search Coaches (DEV Mode)
**URL:** `POST http://localhost:8000/api/search/coaches/dev`

**Request Body:**
```json
{
  "school_name": "Duke",
  "sport_name": "Football"
}
```

**Response:** Array of coach objects (up to 15)
```json
[
  {
    "name": "Mike Elko",
    "position": "Head Coach",
    "email": "melko@duke.edu",
    "phone": "(919) 684-2121",
    "twitter": "https://twitter.com/mikeelko",
    "school": "Duke",
    "sport": "Football",
    "school_logo_url": "https://goduke.com/images/logos/duke-athletics.png"
  }
]
```

**Notes:**
- This is the DEV endpoint (no auth required for testing)
- Returns results immediately (no background jobs)
- Real endpoint is `/api/search/coaches` (requires auth token)

---

## Supabase Database Schema

### Table: `coaches`
Stores all coaches saved by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Auto-generated |
| `user_id` | uuid | FOREIGN KEY → auth.users.id | Owner of this contact |
| `full_name` | text | NOT NULL | Coach's full name |
| `position` | text | | Coach's title/role |
| `email` | text | | Contact email |
| `phone` | text | | Contact phone |
| `twitter_handle` | text | | Twitter/X handle or URL |
| `university_name` | text | | School name |
| `school_logo_url` | text | | URL to school's athletic logo |
| `created_at` | timestamptz | DEFAULT now() | When user saved this coach |

**CRITICAL:** Always filter queries by `user_id = current_user.id`

---

### Table: `search_cache`
Caches search results to avoid redundant API calls.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Auto-generated |
| `school_name` | text | NOT NULL | Search query school |
| `sport_name` | text | NOT NULL | Search query sport |
| `results` | jsonb | | Array of coach objects |
| `created_at` | timestamptz | DEFAULT now() | Cache timestamp |

**Usage:** Check if a search exists in last 24 hours before calling API.

---

### Table: `background_jobs`
Tracks async search jobs (for production mode).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Job ID |
| `user_id` | uuid | FOREIGN KEY → auth.users.id | Job owner |
| `status` | text | | "processing", "completed", "failed" |
| `payload` | jsonb | | { "school": "Duke", "sport": "Football" } |
| `error_message` | text | | Error details if failed |
| `results` | jsonb | | Array of coach objects when completed |
| `created_at` | timestamptz | DEFAULT now() | Job start time |
| `updated_at` | timestamptz | DEFAULT now() | Last status update |

**Note:** Not needed for DEV mode, but should be supported in final app.

---

### Table: `outreach_templates`
User-created message templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Auto-generated |
| `user_id` | uuid | FOREIGN KEY → auth.users.id | Template owner |
| `template_name` | text | NOT NULL | e.g., "Initial Outreach" |
| `subject_line` | text | | Email subject (if channel = email) |
| `message_body` | text | NOT NULL | Template content with {variables} |
| `channel` | text | | "email" or "twitter" |
| `is_default` | bool | DEFAULT false | System-provided template? |
| `created_at` | timestamptz | DEFAULT now() | Created timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last edit timestamp |

**Variables Supported:**
- `{Coach Name}` → coach.full_name
- `{School}` → coach.university_name
- `{Sport}` → user's selected sport
- `{GPA}` → user profile data (future feature)

---

## User Flow

### Flow 1: Find & Save Coaches (FND Module)
1. User logs in via Supabase Auth
2. User lands on Discovery screen
3. User enters "Duke" in school search box
4. User selects "Football" from sport dropdown
5. User taps "Find Opportunities" button
6. App calls `POST /api/search/coaches/dev`
7. Loading screen shows "Finding Coaches..." with spinner
8. Results screen displays 15 coaches with:
   - Colored avatar (generated from initials)
   - Full name
   - Position badge (HEAD COACH, ASSISTANT, etc.)
   - School name below position
   - "+" button on right
9. User taps "+" on 3 coaches → Each INSERT into `coaches` table with `user_id`
10. User taps "MESSAGE" button at bottom → Goes to template selector
11. User taps "EXIT" → Returns to Discovery screen

### Flow 2: View Saved Contacts
1. User opens navigation menu (hamburger icon)
2. User taps "All Contacts"
3. App queries: `SELECT * FROM coaches WHERE user_id = ? ORDER BY full_name ASC`
4. Screen shows "You have X saved contacts" with searchable A-Z list
5. User taps any coach → Coach Detail modal appears
6. Modal shows: School, Position, Email, Phone, Twitter/X
7. User taps X to close modal

### Flow 3: Use Templates (AGT Module)
1. User navigates to "Templates" from menu
2. Screen shows list of pre-made templates:
   - Initial Outreach
   - Follow Up
   - Scholarship Inquiry
   - Visit Request
   - Post-Camp Note
3. User taps "Initial Outreach" → Opens Template Editor
4. Editor shows:
   - Template Name field
   - Message Content field (with smart variables)
   - Video/media attachment area
   - Smart Variables pills: {Coach Name}, {School}, {Sport}, {GPA}
5. User edits message, taps "Save"
6. Template saved to `outreach_templates` table

---

## UI/UX Design Specifications

### Color Palette
- **Background:** #000000 (pure black)
- **Text:** #FFFFFF (white)
- **Primary Button:** #1E90FF (bright blue)
- **Secondary Button:** #FFFFFF with black text
- **Position Badges:**
  - HEAD COACH: #FFD700 (gold/yellow)
  - ASSISTANT: #1E90FF (blue)
  - COORDINATOR: #FF8C00 (orange)
  - RECRUITING: #32CD32 (green)
  - DIRECTOR: #9370DB (purple)

### Avatar Generation
- Use initials from coach's name (e.g., "Mike Elko" → "ME")
- Generate random vibrant background color based on name hash
- White text for initials

### Typography
- Headers: Bold, 28-32pt
- Body: Regular, 16pt
- Labels: 12pt gray (#888888)

### Components
- **Rounded Buttons:** 12px border radius
- **Pill Badges:** 20px border radius
- **Cards:** 16px border radius with subtle shadow
- **Search Inputs:** Dark gray background (#1A1A1A) with white text

---

## Open Questions for Implementation

Claude should ask me about:

1. **Authentication Flow:**
   - Should we use Supabase Magic Link or Email/Password?
   - Do we need social auth (Apple, Google)?
   - Should auth be required immediately or allow guest browsing?

2. **Search Behavior:**
   - Should we check `search_cache` before calling API?
   - If cached result exists (< 24hrs), use it or re-fetch?
   - Should user see "Cached results" indicator?

3. **Saving Coaches:**
   - What happens if user taps "+" on an already-saved coach?
   - Should we show "Already Saved" state or allow duplicates?
   - Should we show a toast notification on save success?

4. **All Contacts:**
   - Should search filter by name, school, or position?
   - Should we group by school or show flat A-Z list?
   - Should there be "Delete" or "Edit" options per coach?

5. **Templates:**
   - Should default templates come from Supabase (`is_default = true`)?
   - Or hardcoded in the app?
   - Should users be able to delete default templates?

6. **Navigation:**
   - Drawer menu or bottom tab navigation?
   - Should "Board" be a separate screen or part of All Contacts?

7. **Messaging (AGT):**
   - Should we integrate actual email/Twitter sending in MVP?
   - Or just "copy to clipboard" for now?
   - Should we track message history in a new table?

8. **Error Handling:**
   - What should happen if API returns 0 coaches?
   - What if Supabase query fails?
   - Should we show retry buttons or just error messages?

---

## Success Criteria

For each feature to be "complete," it must:
1. ✅ Have a working test that passes
2. ✅ Handle all error states gracefully
3. ✅ Match the UI mockups visually
4. ✅ Filter data by `user_id` where applicable

---

## Next Steps

After PRD review:
1. Set up Expo project with Expo Router
2. Configure Supabase client
3. Build Feature 1: Search (Discovery → Loading → Results)
4. Write tests for Feature 1
5. Build Feature 2: Save Coaches
6. Build Feature 3: All Contacts
7. Build Feature 4: Coach Detail
8. Build Feature 5: Templates

Each feature will be built, tested, and approved before moving to the next.