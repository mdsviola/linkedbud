# LinkedIn App Review Notes

**Purpose:** Internal document for LinkedIn App Review submission

**Date:** [Current Date]

**App Name:** Linkedbud

**App URL:** https://linkedbud.com

---

## App Overview and Purpose

Linkedbud is a LinkedIn content creation and analytics co-pilot that helps users ideate, write, schedule, and analyze LinkedIn posts. Our product enables users to:

1. **Content Creation:** Draft and edit LinkedIn posts with AI assistance
2. **Scheduling:** Schedule posts for future publication to personal profiles or organization pages
3. **Publishing:** Publish posts directly to LinkedIn (personal profiles and organization pages users administer)
4. **Analytics:** Fetch and display aggregated post performance metrics (impressions, reactions, comments, shares, clicks, engagement rates)

**Key Point:** Linkedbud focuses exclusively on content creation and analytics. We do not perform lead generation, scraping, mass outreach, automated messaging, or any activity unrelated to content publishing and analytics.

---

## LinkedIn APIs and Scopes Used

### Personal Account Scopes

- **`w_member_social`** — Publish posts to user's personal LinkedIn profile
- **`openid`** — Identify user's LinkedIn account (via OpenID Connect)
- **`profile`** — Retrieve basic profile information (name, profile picture) for UI display
- **`email`** — Optional scope for account verification (if required by LinkedIn)

### Community Management API Scopes (Organization Pages - Optional)

These scopes are part of LinkedIn&apos;s Community Management API and are requested only when users explicitly choose to connect organization pages they administer. They enable both analytics retrieval and post management for organization pages:

- **`r_organization_admin`** — Enumerate organization pages user administers (access control)
- **`r_organization_social`** — Read organization page post data and statistics
- **`w_organization_social`** — Publish posts to organization pages user administers
- **`r_member_postAnalytics`** — Read post performance metrics for member-created content
- **`r_organization_followers`** — Read aggregate follower counts for organization pages
- **`r_organization_social_feed`** — Access organization page feed data
- **`w_organization_social_feed`** — Post to organization page feeds
- **`w_member_social_feed`** — Post to member feeds
- **`r_basicprofile`** — Basic profile information access
- **`r_1st_connections_size`** — Aggregate connection count (for analytics)

**Note:** We request only the minimum scopes necessary for our functionality. We do not request messaging scopes, lead generation scopes, or any permissions unrelated to content publishing and analytics.

---

## Example API Calls and Data Types

### Identity/Profile Endpoints

- **GET** `https://api.linkedin.com/v2/userinfo` (OpenID Connect)
  - Returns: `sub` (LinkedIn member ID), `given_name`, `family_name`, `picture`
  - Used for: Identifying user and displaying profile information in UI

### Publishing Endpoints

- **POST** `https://api.linkedin.com/v2/ugcPosts`
  - Request body includes: author URN (`urn:li:person:{id}` for personal, `urn:li:organization:{id}` for orgs), post content, visibility settings
  - Returns: LinkedIn post ID (URN format)
  - Used for: Publishing posts created by users in Linkedbud

### Organization Endpoints

- **GET** `https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`
  - Returns: List of organization URNs user administers
  - Used for: Enumerating organization pages user can post to

- **GET** `https://api.linkedin.com/v2/organizations/{organizationId}`
  - Returns: Organization metadata (name, vanity name, logo URL)
  - Used for: Displaying organization options in UI

### Analytics Endpoints

- **GET** `https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=entity&entity=(share:{postId})&queryType={IMPRESSION|REACTION|COMMENT|RESHARE|MEMBERS_REACHED}`
  - Returns: Aggregated metrics (impressions, reactions, comments, shares, members reached)
  - Used for: Personal post performance analytics

- **GET** `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:{orgId}&shares=List({postId})`
  - Returns: Aggregated metrics (impressions, likes, comments, shares, clicks)
  - Used for: Organization post performance analytics

### Data Types Stored

- **Access tokens** and expiration timestamps (encrypted, server-side only)
- **Organization IDs and names** for organizations user administers
- **Post content** created by user in Linkedbud, **LinkedIn post IDs** returned by LinkedIn API
- **Aggregated metrics** (impressions, reactions/likes, comments, shares, clicks, engagement rate)

**We do not store:** Private messages, connection lists for marketing purposes, email addresses for lead generation, or any data unrelated to content publishing and analytics.

---

## Data Storage and Deletion Practices

### Storage

- **Database:** Supabase (PostgreSQL) with encryption at rest
- **Encryption in Transit:** HTTPS/TLS for all API communication
- **Server-Side Only:** Access tokens never exposed to client-side code

### Tables and Data Retention

1. **`linkedin_tokens`** table
   - Stores: Access tokens, expiration timestamps, minimal profile metadata
   - Retention: While integration is active; deleted immediately upon disconnect or account deletion
   - Deletion method: Database DELETE query when user disconnects LinkedIn or deletes account

2. **`linkedin_organizations`** table
   - Stores: Organization IDs and names for organizations user administers
   - Retention: While organization integration is active; deleted upon organization disconnect or account deletion
   - Deletion method: Database DELETE query when user disconnects organizations or deletes account

3. **`linkedin_posts`** table
   - Stores: User's drafted content, LinkedIn post IDs, timestamps, organization ID (if applicable)
   - Retention: While account is active; deleted upon account deletion or user request
   - Deletion method: Database DELETE query on account deletion or data erasure request

4. **`linkedin_post_metrics`** table
   - Stores: Aggregated post metrics snapshots
   - Retention: While account is active (for historical analytics); deleted upon account deletion or user request
   - Deletion method: Database DELETE query on account deletion or data erasure request

### User-Initiated Deletion

- **In-App Disconnect:** Users can disconnect LinkedIn in Settings → Integrations → Disconnect LinkedIn. This immediately deletes `linkedin_tokens` and, for organizations, `linkedin_organizations` records.
- **LinkedIn Revocation:** Users can revoke Linkedbud's access on LinkedIn (Settings & Privacy → Data privacy → Other applications → Permitted services). We detect revoked tokens and remove stored data.
- **Account Deletion:** Deleting an Linkedbud account triggers cascade deletion of all LinkedIn-related data (tokens, organization mappings, post IDs, metrics, drafts).

---

## Security Practices

1. **OAuth 2.0 Authorization Flow:** Industry-standard OAuth 2.0 authorization code flow
2. **HTTPS/TLS Encryption:** All API communication encrypted in transit
3. **Server-Side Token Handling:** Access tokens stored server-side only, never in browser cookies, localStorage, or client-side code
4. **Environment Variables:** Credentials stored as environment variables (not hardcoded)
5. **Token Validation:** We validate tokens before API calls and notify users of expiring tokens
6. **Principle of Least Privilege:** Internal access to tokens restricted to minimal necessary operations
7. **Audit Logging:** We log API operations (without logging access tokens or sensitive data)

---

## Compliance Contact Information

- **Privacy and Data Protection Inquiries:** privacy@linkedbud.com
- **General Support:** support@linkedbud.com
- **Compliance Officer:** Available via privacy@linkedbud.com

---

## Disclosures

- **Powered by LinkedIn API**
- **Not Affiliated with LinkedIn:** Linkedbud is not affiliated with, endorsed by, or sponsored by LinkedIn
- **Trademark Notice:** LinkedIn, the LinkedIn logo, and related marks are trademarks of LinkedIn Corporation
- **Compliance:** All usage of LinkedIn data complies with LinkedIn's API Terms of Use and Marketing API Terms

### Relevant LinkedIn Policies

- [LinkedIn API Terms of Use](https://www.linkedin.com/legal/l/api-terms-of-use)
- [LinkedIn Marketing Developer Platform Terms](https://www.linkedin.com/legal/l/marketing-api-terms)
- [LinkedIn Brand Guidelines](https://brand.linkedin.com/)

---

## Additional Notes

- **Token Expiration:** LinkedIn access tokens expire per LinkedIn's policy. We track expiration and notify users when tokens are expiring soon, prompting reconnection.
- **No Refresh Tokens:** LinkedIn does not provide refresh tokens by default for most applications. Users must re-authorize when tokens expire.
- **User Consent:** All publishing actions require explicit user consent. We do not automatically publish content without user action.
- **Data Minimization:** We request and store only the minimum data necessary for our functionality.
- **No Data Sharing:** We do not sell or share LinkedIn data with third parties for advertising or marketing purposes.

---

**End of Document**

