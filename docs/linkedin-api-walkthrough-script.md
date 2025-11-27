# LinkedIn Community Management API Standard Tier - Product Walkthrough Script

## Overview
This script is based on a comprehensive analysis of the codebase. All features described are **implemented and present** in the application. This script demonstrates only features allowed under the LinkedIn Community Management API Standard Tier.

---

## 1. INTRODUCTION (0:00 - 0:30)

**Scene:** Show the application dashboard or landing page

**Narration:**
"Welcome to [Product Name], a content management platform designed to help organizations and professionals streamline their LinkedIn presence. Our platform enables users to create, schedule, and manage LinkedIn content for both personal profiles and organization pages, all while respecting user permissions and LinkedIn's API guidelines."

**Key Points:**
- Platform helps manage LinkedIn presence
- Supports both personal and organization pages
- All actions require explicit user permission

---

## 2. AUTHENTICATION FLOW (0:30 - 1:30)

**Scene:** Navigate to Settings > Integrations tab

**Narration:**
"Before using any LinkedIn features, users must explicitly connect their LinkedIn account and grant permissions. Let me show you how this works."

**Actions:**
1. Click on "Settings" in the navigation
2. Navigate to the "Integrations" tab
3. Show the LinkedIn Integration section

**Narration (continued):**
"Here in the Settings page, we have a dedicated LinkedIn Integration section. Users see two distinct connection options: one for their personal LinkedIn profile, and another for organization management through LinkedIn's Community Management API."

**Actions:**
4. Click "Connect Personal LinkedIn Profile" button
5. Show the redirect to LinkedIn OAuth page (or describe it)

**Narration:**
"When a user clicks 'Connect Personal LinkedIn Profile', they are redirected to LinkedIn's official authorization page. LinkedIn clearly displays the permissions being requested, including access to post on their behalf. The user must explicitly click 'Allow' on LinkedIn's page to grant these permissions."

**Actions:**
6. Show returning from LinkedIn callback (or describe the flow)
7. Show the "Connect Organization Pages" button

**Narration:**
"After granting permission, the user is redirected back to our application. We then request separate authorization for organization management, which uses LinkedIn's Community Management API. This requires additional permissions that allow posting to organization pages the user administers."

**Actions:**
8. Click "Connect Organization Pages"
9. Show the organization connection flow

**Narration:**
"Once connected, our application fetches the list of organizations where the user has administrator privileges. These organizations are stored locally in our database for quick access, but we never store sensitive tokens in a way that could be exposed."

**Key Points Demonstrated:**
- ✅ Explicit user login required
- ✅ Clear permission requests
- ✅ Separate flows for personal vs organization
- ✅ User must grant permissions on LinkedIn's page
- ✅ No automatic or hidden connections

---

## 3. DASHBOARD OVERVIEW (1:30 - 2:00)

**Scene:** Show the main dashboard

**Narration:**
"Once connected, users land on their dashboard, which provides an overview of their content activity."

**Actions:**
1. Show dashboard with post counts (Total Posts, Published, Drafts, Scheduled)
2. Point to the navigation menu

**Narration:**
"The dashboard displays key metrics: total posts created, published posts, drafts, and scheduled content. The navigation menu provides access to all LinkedIn-related features, including Posts, Analytics, and Settings."

**Key Points:**
- Dashboard shows content statistics
- Clear navigation to LinkedIn features
- No sensitive data displayed without permission

---

## 4. ORGANIZATION SELECTION (2:00 - 2:45)

**Scene:** Navigate to Posts page

**Narration:**
"One of the core features of our platform is the ability to manage content for multiple LinkedIn accounts - both personal profiles and organization pages. Let me show you how users select which account they're working with."

**Actions:**
1. Navigate to "/posts" or the Posts page
2. Show the PostContextSelector component (tabs for "Personal" and organization names)

**Narration:**
"On the Posts page, users see a context selector with tabs. The first tab is always 'Personal', representing the user's personal LinkedIn profile. Additional tabs appear for each organization page the user administers, clearly labeled with the organization name."

**Actions:**
3. Click on different tabs to show filtering
4. Show that posts are filtered by context

**Narration:**
"When a user selects a tab, the post list filters to show only content associated with that account. This ensures users can easily manage content for different LinkedIn accounts separately. The organization names are fetched directly from LinkedIn's API based on the user's administrator permissions."

**Key Points:**
- ✅ Clear organization selection UI
- ✅ Organizations fetched via LinkedIn API
- ✅ Only shows organizations user administers
- ✅ Separate content management per account

---

## 5. CREATING A POST (2:45 - 4:00)

**Scene:** Create a new post

**Narration:**
"Now let's create a new LinkedIn post. Our platform allows users to generate AI-powered content or create custom posts."

**Actions:**
1. Click "Create Post" button
2. Show the CreatePostModal component opening
3. Fill in the form fields (topic, tone, post type, etc.)

**Narration:**
"The post creation modal provides various options for customizing content. Users can specify the topic, tone, target audience, and other parameters. Importantly, users can select which LinkedIn account this post will be published to - either their personal profile or one of their organization pages."

**Actions:**
4. Show the "Publish Target" or account selector in the modal
5. Select an organization from the dropdown
6. Optionally attach an image, document, or video
7. Click "Generate" or "Create"

**Narration:**
"Users can attach media files - images, documents, or videos - which will be uploaded to LinkedIn when the post is published. After filling in the details, clicking 'Generate' creates a draft post that's saved in our database. This draft is stored locally and hasn't been sent to LinkedIn yet."

**Actions:**
8. Show the post being created and saved as DRAFT
9. Navigate to the post detail page

**Narration:**
"The post is created with a 'DRAFT' status, meaning it exists only in our platform and hasn't been published to LinkedIn. Users can review, edit, and refine the content before deciding to publish."

**Key Points:**
- ✅ Draft creation (local, not via LinkedIn API)
- ✅ Organization selection during creation
- ✅ Media attachment support
- ✅ Content stored as draft until user publishes
- ✅ No automatic publishing

---

## 6. SCHEDULING A POST (4:00 - 5:00)

**Scene:** Schedule a draft post

**Narration:**
"Users can schedule posts to be published at a future date and time. This is particularly useful for maintaining a consistent posting schedule."

**Actions:**
1. On the post detail page, click "Schedule" button
2. Show the SchedulePostModal opening

**Narration:**
"From any draft post, users can click the 'Schedule' button to open the scheduling modal."

**Actions:**
3. Show the date picker and time selector
4. Show the "Publish to Account" dropdown (Personal vs Organizations)
5. Select a date and time in the future
6. Select an organization from the dropdown
7. Click "Schedule Post"

**Narration:**
"The scheduling modal allows users to select a specific date and time for publication. Users must also choose which LinkedIn account - personal or organization - the post will be published to. The scheduled time is converted to UTC and stored in our database."

**Actions:**
8. Show the post status changing to "SCHEDULED"
9. Navigate to the Scheduled Posts calendar view

**Narration:**
"Once scheduled, the post status changes to 'SCHEDULED'. Users can view all scheduled posts in a calendar view, which shows posts organized by date. The calendar distinguishes between personal posts and organization posts using different colors."

**Actions:**
10. Show the ScheduledPostsCalendar component
11. Point out posts on different dates
12. Show the color coding for personal vs organization posts

**Narration:**
"Our background job system checks every 30 minutes for scheduled posts that are due to be published. When a scheduled post's time arrives, our system automatically publishes it to the selected LinkedIn account using the user's stored access token. This happens server-side, ensuring reliable publication even if the user isn't actively using the platform."

**Key Points:**
- ✅ Scheduling with date/time selection
- ✅ Organization selection for scheduled posts
- ✅ Calendar visualization
- ✅ Automatic publishing via background job
- ✅ Uses stored user permissions

---

## 7. PUBLISHING A POST (5:00 - 5:45)

**Scene:** Publish a draft post immediately

**Narration:**
"Users can also publish posts immediately without scheduling. Let me show you that flow."

**Actions:**
1. Navigate to a draft post
2. Show the "Publish to LinkedIn" button (PublishToLinkedInButton component)
3. Click the button

**Narration:**
"On any draft post, users see a 'Publish to LinkedIn' button. The button text changes based on the post's target account - it will say 'Publish to Personal LinkedIn' or 'Publish to [Organization Name]'s LinkedIn'."

**Actions:**
4. Show the publish confirmation or direct publishing
5. Show the post status changing to "PUBLISHED"
6. Show the LinkedIn post ID being stored

**Narration:**
"When the user clicks publish, our application makes an API call to LinkedIn's UGC Posts API. For personal posts, we use the user's personal access token. For organization posts, we use the Community Management API token and specify the organization URN. The post is published with 'PUBLIC' visibility, and LinkedIn returns a post ID which we store for tracking purposes."

**Actions:**
7. Show a link to view the post on LinkedIn
8. Show the post metrics section appearing

**Narration:**
"After successful publication, users can click a link to view their post directly on LinkedIn. The post detail page also begins to show performance metrics, which we'll explore next."

**Key Points:**
- ✅ Explicit publish action required
- ✅ Uses correct API endpoint (UGC Posts API)
- ✅ Supports both personal and organization publishing
- ✅ Stores LinkedIn post ID for tracking
- ✅ No automatic publishing without user action

---

## 8. ANALYTICS AND METRICS (5:45 - 7:00)

**Scene:** Show post analytics

**Narration:**
"Our platform provides analytics for published posts, pulling data directly from LinkedIn's analytics APIs."

**Actions:**
1. Navigate to a published post detail page
2. Show the PostMetricsDisplay component
3. Point out the metrics: Impressions, Likes, Comments, Shares, Clicks, Engagement Rate

**Narration:**
"For each published post, we display performance metrics retrieved from LinkedIn's analytics APIs. For personal posts, we use the memberCreatorPostAnalytics endpoint. For organization posts, we use the organizationalEntityShareStatistics endpoint. These are the standard analytics endpoints provided by LinkedIn."

**Actions:**
4. Navigate to the Analytics page
5. Show the context selector (All Posts, Personal, Organization tabs)
6. Show the time period selector
7. Show overview cards with aggregated metrics

**Narration:**
"The Analytics page provides a comprehensive view of post performance. Users can filter by context - viewing all posts together, or filtering to see only personal posts or posts from a specific organization. Time period filters allow users to analyze performance over 7 days, 30 days, 90 days, or a custom date range."

**Actions:**
8. Show the time series chart
9. Show the engagement breakdown
10. Show the top posts table

**Narration:**
"Visualizations include time series charts showing how metrics change over time, engagement breakdowns showing the distribution of likes, comments, and shares, and a table of top-performing posts. All of this data comes directly from LinkedIn's analytics APIs, which we query on behalf of the user using their stored access tokens."

**Actions:**
11. Click on a metric in the post detail page to show the chart modal
12. Show historical metric data

**Narration:**
"Users can click on individual metrics to see detailed charts with historical data. Our system periodically fetches updated metrics from LinkedIn and stores them, allowing users to track how their posts perform over time."

**Key Points:**
- ✅ Analytics from LinkedIn's official APIs
- ✅ Separate endpoints for personal vs organization
- ✅ Context filtering (personal/organization)
- ✅ Time period filtering
- ✅ Historical data tracking
- ✅ No individual profile insights (only post metrics)
- ✅ No network growth metrics

---

## 9. ORGANIZATION MANAGEMENT (7:00 - 7:30)

**Scene:** Show organization management in Settings

**Narration:**
"Let me show you how organization access is managed."

**Actions:**
1. Navigate back to Settings > Integrations
2. Show the LinkedIn Integration section
3. Point out the connected organizations list

**Narration:**
"In the Settings page, users can see all organizations they have access to. These organizations are fetched using LinkedIn's organizationAcls endpoint, which only returns organizations where the user has administrator privileges with approved status. We display the organization name and store the organization ID for API calls."

**Actions:**
4. Show the disconnect option
5. Explain what happens on disconnect

**Narration:**
"Users can disconnect their organization access at any time. When they do, we revoke the access token with LinkedIn and remove the organization from our local database. This ensures users maintain full control over their LinkedIn integrations."

**Key Points:**
- ✅ Organizations fetched via organizationAcls API
- ✅ Only shows organizations user administers
- ✅ Users can disconnect at any time
- ✅ Token revocation on disconnect

---

## 10. CLOSING AND COMPLIANCE (7:30 - 8:00)

**Scene:** Return to dashboard or show a summary view

**Narration:**
"To summarize, our platform provides a comprehensive solution for managing LinkedIn content while fully respecting user permissions and LinkedIn's API guidelines."

**Key Compliance Points to Emphasize:**

1. **User Permission Required:**
   - "All LinkedIn interactions require explicit user login and permission grants through LinkedIn's OAuth flow."

2. **Standard Tier Compliance:**
   - "We use only the endpoints allowed under the Community Management API Standard Tier: UGC Posts API for publishing, organizationAcls for organization access, and analytics endpoints for post metrics."

3. **No Prohibited Features:**
   - "We do not implement comment replies, direct messaging, network growth features, or any functionality not permitted at the Standard Tier level."

4. **Organization Focus:**
   - "Our platform helps organizations manage their LinkedIn presence by allowing administrators to create, schedule, and analyze content for the organization pages they manage."

5. **Transparency:**
   - "All actions are user-initiated. We never automatically publish content or perform actions without explicit user consent."

6. **Data Handling:**
   - "We store only the necessary data - access tokens, organization metadata, and post content - and use it solely for the features the user has explicitly enabled."

**Final Statement:**
"Our application is designed to be a helpful tool for LinkedIn content management, operating entirely within the boundaries of LinkedIn's Community Management API Standard Tier and always with explicit user permission."

---

## IMPLEMENTED FEATURES SUMMARY

Based on codebase analysis, the following features are **implemented and present**:

### Authentication & Authorization
- ✅ Personal LinkedIn OAuth (w_member_social scope)
- ✅ Community Management API OAuth (organization scopes)
- ✅ Token storage and automatic refresh
- ✅ Settings page for connection management
- ✅ Token revocation on disconnect

### Organization Management
- ✅ Fetch accessible organizations via organizationAcls API
- ✅ Store organization metadata (ID, name, vanity name)
- ✅ Organization selector UI (PostContextSelector component)
- ✅ Filter posts by organization context

### Post Creation
- ✅ CreatePostModal component for draft creation
- ✅ Support for publish_target selection (personal/organization)
- ✅ Media attachment (images, documents, videos)
- ✅ Drafts stored locally in database (status: DRAFT)
- ✅ Post editing and content updates

### Post Publishing
- ✅ PublishToLinkedInButton component
- ✅ Immediate publishing via /api/linkedin/publish endpoint
- ✅ Uses LinkedIn UGC Posts API
- ✅ Supports personal and organization publishing
- ✅ Media upload to LinkedIn (images, documents, videos)
- ✅ Stores LinkedIn post ID for tracking

### Post Scheduling
- ✅ SchedulePostModal component
- ✅ Date and time selection
- ✅ Organization selection for scheduled posts
- ✅ Scheduled posts stored (status: SCHEDULED)
- ✅ Background cron job (publish-scheduled-posts function)
- ✅ Automatic publishing when scheduled time arrives
- ✅ ScheduledPostsCalendar component for visualization

### Analytics & Metrics
- ✅ PostMetricsDisplay component for individual post metrics
- ✅ Analytics page with overview cards, charts, and tables
- ✅ Personal post metrics via memberCreatorPostAnalytics API
- ✅ Organization post metrics via organizationalEntityShareStatistics API
- ✅ Metrics tracked: Impressions, Likes, Comments, Shares, Clicks, Engagement Rate
- ✅ Context filtering (personal vs organization)
- ✅ Time period filtering (7d, 30d, 90d, custom, all time)
- ✅ Historical metrics tracking
- ✅ Metrics chart modal for detailed views

### UI Components
- ✅ Dashboard with post statistics
- ✅ Posts list page with context tabs
- ✅ Post detail page with full content and actions
- ✅ Settings page with LinkedIn integration section
- ✅ Analytics page with comprehensive visualizations

---

## FEATURES NOT IMPLEMENTED (Standard Tier Restrictions)

The following features are **not present** in the codebase and should **not** be mentioned in the script:

- ❌ Comment replies or comment management
- ❌ Direct messaging (DMs)
- ❌ Network growth features
- ❌ Advanced individual profile insights
- ❌ LinkedIn draft API usage (we create drafts locally)
- ❌ Any features requiring Premium Tier access

---

## TECHNICAL NOTES FOR VIDEO PRODUCTION

### UI Components to Highlight:
1. **PostContextSelector** (`src/components/post-context-selector.tsx`)
   - Tabs for Personal and Organizations
   - Used in Posts pages

2. **CreatePostModal** (`src/components/create-post-modal.tsx`)
   - Post creation form
   - Publish target selector
   - Media attachment

3. **SchedulePostModal** (`src/components/schedule-post-modal.tsx`)
   - Date/time picker
   - Organization selector

4. **PublishToLinkedInButton** (`src/components/publish-to-linkedin-button.tsx`)
   - Publish action button
   - Dynamic text based on target

5. **PostMetricsDisplay** (`src/components/post-metrics-display-enhanced.tsx`)
   - Individual post metrics
   - Clickable metrics with charts

6. **ScheduledPostsCalendar** (`src/components/scheduled-posts-calendar.tsx`)
   - Calendar view of scheduled/published posts
   - Color coding by organization

7. **AnalyticsClient** (`src/app/(authenticated)/analytics/analytics-client.tsx`)
   - Full analytics dashboard
   - Context and time period filters

### API Endpoints Used:
- `/api/linkedin/auth` - Personal OAuth initiation
- `/api/linkedin/organizations/auth` - Organization OAuth initiation
- `/api/linkedin/callback` - Personal OAuth callback
- `/api/linkedin/organizations/callback` - Organization OAuth callback
- `/api/linkedin/organizations` - Fetch user's organizations
- `/api/linkedin/publish` - Publish post to LinkedIn
- `/api/linkedin/metrics` - Fetch post metrics
- `/api/analytics` - Comprehensive analytics data

### LinkedIn API Endpoints Used:
- `https://www.linkedin.com/oauth/v2/authorization` - OAuth authorization
- `https://www.linkedin.com/oauth/v2/accessToken` - Token exchange
- `https://api.linkedin.com/v2/ugcPosts` - Post publishing (UGC Posts API)
- `https://api.linkedin.com/v2/organizationAcls` - Organization access (organizationAcls API)
- `https://api.linkedin.com/rest/memberCreatorPostAnalytics` - Personal post metrics
- `https://api.linkedin.com/rest/organizationalEntityShareStatistics` - Organization post metrics

---

## SCRIPT USAGE GUIDELINES

1. **Follow the script exactly** - All features mentioned are implemented
2. **Do not add features** - Only demonstrate what exists in the codebase
3. **Emphasize permissions** - Always mention that user permission is required
4. **Show the UI** - Point to actual UI components as they appear
5. **Be transparent** - Acknowledge what the platform does and doesn't do
6. **Keep it factual** - No speculation or future features

---

## END OF SCRIPT

This script is based on codebase analysis completed on [Date]. All features described are verified to exist in the application code.



