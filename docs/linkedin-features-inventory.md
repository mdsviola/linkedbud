# LinkedIn Integration Features Inventory

This document provides a complete inventory of all LinkedIn-related features implemented in the codebase, verified through code analysis.

---

## Authentication & Authorization

### Personal LinkedIn Connection

- **Component:** Settings page (`src/app/(authenticated)/settings/settings-client.tsx`)
- **API Route:** `/api/linkedin/auth` → `/api/linkedin/callback`
- **OAuth Scopes:** `openid profile w_member_social email`
- **Features:**
  - OAuth flow initiation
  - Token storage in `linkedin_tokens` table
  - Token refresh mechanism
  - Profile data fetching (name, picture)
  - Disconnect functionality with token revocation

### Organization/Community Management Connection

- **Component:** Settings page (`src/app/(authenticated)/settings/settings-client.tsx`)
- **API Route:** `/api/linkedin/organizations/auth` → `/api/linkedin/organizations/callback`
- **OAuth Scopes:** `r_member_postAnalytics r_organization_followers r_organization_social rw_organization_admin r_organization_social_feed w_member_social r_member_profileAnalytics w_organization_social r_basicprofile w_organization_social_feed w_member_social_feed r_1st_connections_size`
- **Features:**
  - Separate OAuth flow for organization management
  - Fetches accessible organizations via `organizationAcls` API
  - Stores organization metadata in `linkedin_organizations` table
  - Disconnect functionality with token revocation

---

## Organization Management

### Fetching Organizations

- **API Endpoint:** `https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`
- **Implementation:** `src/shared/linkedin/client.ts` - `getAccessibleOrganizations()`
- **Features:**
  - Fetches organizations where user has ADMINISTRATOR role
  - Only returns APPROVED organizations
  - Retrieves organization details (ID, name, vanity name)
  - Stores in database for quick access

### Organization Selection UI

- **Component:** `PostContextSelector` (`src/components/post-context-selector.tsx`)
- **Usage:** Posts pages, Analytics page
- **Features:**
  - Tab-based selector showing "Personal" and organization names
  - Filters content by selected context
  - Visual distinction between personal and organization tabs

---

## Post Creation

### Draft Creation

- **Component:** `CreatePostModal` (`src/components/create-post-modal.tsx`)
- **API Route:** `/api/posts/create`
- **Features:**
  - Form-based post creation with fields:
    - Topic/title
    - Tone selection
    - Post type
    - Target audience
    - Key points
    - Call to action
    - Hashtags option
    - Emojis option
    - Post length
    - Language selection
  - **Publish Target Selection:** Dropdown to select "personal" or organization ID
  - **Media Attachments:**
    - Image upload
    - Document upload (PDF)
    - Video upload
  - Creates post with `status: "DRAFT"` in database
  - Stores `publish_target` field for context filtering

### Post Editing

- **Component:** `CreatePostModal` (edit mode)
- **API Route:** `/api/posts/[id]` (PUT)
- **Features:**
  - Edit existing draft posts
  - Update content, media, and publish target
  - Maintains post ID and relationships

---

## Post Publishing

### Immediate Publishing

- **Component:** `PublishToLinkedInButton` (`src/components/publish-to-linkedin-button.tsx`)
- **API Route:** `/api/linkedin/publish`
- **LinkedIn API:** `https://api.linkedin.com/v2/ugcPosts`
- **Features:**
  - Publishes draft posts immediately
  - Supports personal and organization publishing
  - Handles media uploads:
    - Images → `uploadImageAsset()`
    - Documents → `uploadDocumentAsset()`
    - Videos → `uploadVideoAsset()`
  - Uses correct author URN:
    - Personal: `urn:li:person:{linkedinId}`
    - Organization: `urn:li:organization:{orgId}`
  - Stores LinkedIn post ID in `linkedin_posts` table
  - Updates post status to `PUBLISHED`
  - Logs publication in `linkedin_posts` table

### Publishing Flow

1. User clicks "Publish to LinkedIn" button
2. System determines token type (personal vs community)
3. If media exists, uploads to LinkedIn first
4. Constructs UGC Post payload with:
   - Author URN
   - Content text
   - Media assets (if any)
   - Visibility: PUBLIC
   - Lifecycle state: PUBLISHED
5. Makes POST request to LinkedIn UGC Posts API
6. Stores returned post ID
7. Updates post status

---

## Post Scheduling

### Scheduling Interface

- **Component:** `SchedulePostModal` (`src/components/schedule-post-modal.tsx`)
- **API Route:** `/api/posts/[id]` (PUT with `scheduled_publish_date`)
- **Features:**
  - Date picker for selecting publish date
  - Time slot selector (30-minute intervals)
  - Organization selection dropdown
  - Validation (must be future date/time)
  - Clear schedule option
  - Converts local time to UTC for storage

### Scheduled Post Execution

- **Edge Function:** `supabase/functions/publish-scheduled-posts/index.ts`
- **Trigger:** Cron job running every 30 minutes
- **Process:**
  1. Queries posts with `status='SCHEDULED'` and `scheduled_publish_date <= now()`
  2. For each post:
     - Determines token type based on `publish_target`
     - Retrieves valid access token
     - Downloads media files from storage (if any)
     - Uploads media to LinkedIn
     - Publishes post using UGC Posts API
     - Updates post status to `PUBLISHED` or `FAILED`
     - Logs result in `linkedin_posts` table

### Calendar Visualization

- **Component:** `ScheduledPostsCalendar` (`src/components/scheduled-posts-calendar.tsx`)
- **Features:**
  - Month view calendar
  - Shows scheduled and published posts
  - Color coding by organization
  - Click to view posts for a specific day
  - Displays post count per day
  - Visual distinction between scheduled and published

---

## Analytics & Metrics

### Individual Post Metrics

- **Component:** `PostMetricsDisplay` (`src/components/post-metrics-display-enhanced.tsx`)
- **API Route:** `/api/linkedin/metrics?linkedinPostId={id}`
- **LinkedIn APIs:**
  - Personal: `https://api.linkedin.com/rest/memberCreatorPostAnalytics`
  - Organization: `https://api.linkedin.com/rest/organizationalEntityShareStatistics`
- **Metrics Displayed:**
  - Impressions
  - Likes
  - Comments
  - Shares
  - Clicks
  - Engagement Rate (calculated)
- **Features:**
  - Real-time metric fetching
  - Historical data tracking
  - Clickable metrics with chart modal
  - Trend indicators (up/down/neutral)

### Analytics Dashboard

- **Component:** `AnalyticsClient` (`src/app/(authenticated)/analytics/analytics-client.tsx`)
- **API Route:** `/api/analytics`
- **Features:**
  - **Overview Cards:**
    - Total impressions
    - Total engagement
    - Average engagement rate
    - Post count
  - **Time Series Chart:**
    - Metrics over time
    - Multiple metric lines
  - **Engagement Breakdown:**
    - Likes, comments, shares distribution
  - **Content Insights:**
    - Posts by status
    - Average impressions
    - Average engagement rate
  - **Top Posts Table:**
    - Sortable by impressions, likes, comments, shares, engagement rate
    - Shows post content preview
    - Links to post detail page
  - **Context Filtering:**
    - All Posts
    - Personal only
    - Organization-specific
  - **Time Period Filtering:**
    - 7 days
    - 30 days
    - 90 days
    - Custom date range
    - All time

### Metrics Fetching

- **Background Job:** `supabase/functions/fetch-linkedin-metrics/index.ts`
- **Process:**
  - Periodically fetches metrics for published posts
  - Uses appropriate API based on post type (personal vs organization)
  - Stores metrics in `linkedin_post_metrics` table
  - Tracks historical changes

---

## UI Components & Pages

### Dashboard

- **Component:** `DashboardClient` (`src/app/(authenticated)/dashboard/dashboard-client.tsx`)
- **Features:**
  - Post count cards (Total, Published, Drafts, Scheduled)
  - Recent posts list
  - Quick actions
  - Analytics widget preview

### Posts List

- **Component:** `PostsClient` (`src/app/(authenticated)/posts/posts-client.tsx`)
- **Features:**
  - Context selector (Personal/Organizations)
  - Status filtering (All, Draft, Scheduled, Published)
  - Pagination
  - Post cards with preview
  - Create post button

### Post Detail

- **Component:** `PostDetailClient` (`src/app/(authenticated)/posts/[id]/post-detail-client.tsx`)
- **Features:**
  - Full post content display
  - Media preview (images, documents, videos)
  - Post actions:
    - Edit
    - Publish
    - Schedule
    - Delete
    - Copy content
    - View on LinkedIn
  - Metrics display
  - Status badge
  - Organization/personal indicator

### Settings

- **Component:** `SettingsClient` (`src/app/(authenticated)/settings/settings-client.tsx`)
- **Features:**
  - LinkedIn Integration tab
  - Personal connection status
  - Organization connection status
  - Connect/Disconnect buttons
  - Organization list display
  - Token expiration warnings

---

## Database Schema

### Tables Used

1. **`linkedin_tokens`**

   - Stores OAuth tokens (personal and community)
   - Token refresh tracking
   - Profile data caching

2. **`linkedin_organizations`**

   - Organization metadata
   - User-organization relationships

3. **`posts`**

   - Post content and metadata
   - Status tracking (DRAFT, SCHEDULED, PUBLISHED, ARCHIVED)
   - Publish target (personal or organization ID)
   - Scheduled publish date

4. **`linkedin_posts`**

   - LinkedIn post IDs
   - Publication status
   - Organization ID (if organization post)
   - Published timestamp

5. **`linkedin_post_metrics`**
   - Historical metrics data
   - Fetched timestamp
   - All metric values

---

## API Endpoints Summary

### Internal API Routes

- `GET /api/linkedin/auth` - Initiate personal OAuth
- `GET /api/linkedin/callback` - Personal OAuth callback
- `GET /api/linkedin/organizations/auth` - Initiate organization OAuth
- `GET /api/linkedin/organizations/callback` - Organization OAuth callback
- `GET /api/linkedin/organizations` - Fetch user's organizations
- `GET /api/linkedin/status` - Check connection status
- `POST /api/linkedin/publish` - Publish post to LinkedIn
- `GET /api/linkedin/metrics` - Fetch post metrics
- `POST /api/linkedin/revoke` - Revoke token
- `GET /api/analytics` - Comprehensive analytics data
- `GET /api/dashboard/analytics` - Dashboard analytics widget
- `GET /api/dashboard/scheduled-posts` - Scheduled posts for calendar

### LinkedIn API Endpoints Used

- `https://www.linkedin.com/oauth/v2/authorization` - OAuth authorization
- `https://www.linkedin.com/oauth/v2/accessToken` - Token exchange
- `https://www.linkedin.com/oauth/v2/revoke` - Token revocation
- `https://api.linkedin.com/v2/ugcPosts` - Post publishing
- `https://api.linkedin.com/v2/organizationAcls` - Organization access
- `https://api.linkedin.com/v2/assets` - Media upload (images, documents, videos)
- `https://api.linkedin.com/rest/memberCreatorPostAnalytics` - Personal post metrics
- `https://api.linkedin.com/rest/organizationalEntityShareStatistics` - Organization post metrics

---

## Features NOT Implemented

The following features are **not present** in the codebase:

- ❌ Comment replies or comment management
- ❌ Direct messaging (DMs)
- ❌ Network growth features
- ❌ Advanced individual profile insights
- ❌ LinkedIn draft API (drafts are created locally)
- ❌ Post editing on LinkedIn (only local editing)
- ❌ Post deletion on LinkedIn (only local deletion)
- ❌ Any Premium Tier features

---

## Compliance Notes

### Standard Tier Compliance

All implemented features use only Standard Tier endpoints:

- ✅ UGC Posts API for publishing
- ✅ organizationAcls for organization access
- ✅ Analytics endpoints for post metrics
- ✅ No Premium Tier endpoints

### Permission Requirements

- ✅ All actions require explicit user login
- ✅ OAuth flows require user consent on LinkedIn
- ✅ Tokens stored securely with refresh mechanism
- ✅ Users can revoke access at any time

### Data Handling

- ✅ Only stores necessary data (tokens, metadata, post content)
- ✅ Uses data solely for enabled features
- ✅ No data sharing with third parties
- ✅ Token revocation removes all access

---

## Last Updated

Based on codebase analysis completed on the date this document was generated.
