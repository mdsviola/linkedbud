# LinkedIn Token Expiration Warning

This feature automatically detects when a user's LinkedIn access token is about to expire (within 5 days) and shows a modal warning to prompt them to refresh their connection.

## How it works

1. **Token Expiration Check**: The system checks the `token_expires_at` field in the `linkedin_accounts` table
2. **Modal Display**: If the token expires within 5 days, a modal is shown to the user
3. **User Actions**: The user can either:
   - Refresh the connection (redirects to LinkedIn authorization flow)
   - Reconnect their LinkedIn account (redirects to LinkedIn authorization flow)
   - Dismiss the modal (it will show again on next page load if still expiring)

## Components

### `LinkedInTokenExpirationModal`

- Displays the expiration warning
- Provides refresh and reconnect options (both redirect to LinkedIn auth)
- Simple, clean interface without loading states

### `useLinkedInTokenExpiration` Hook

- Checks token expiration status via API
- Manages modal visibility state
- Handles dismissal and reset functionality

### API Endpoints

#### `GET /api/linkedin/expiration-status`

Returns the current token expiration status for the authenticated user.

**Response:**

```json
{
  "hasLinkedInAccount": true,
  "tokenExpiresAt": "2024-01-15T10:30:00Z",
  "isActive": true
}
```

#### Note on Token Refresh

Since LinkedIn doesn't provide refresh tokens by default for most applications, both "Refresh Connection" and "Reconnect Account" buttons redirect users to the LinkedIn authorization flow (`/api/linkedin/auth`). This ensures users can always re-establish their connection when needed.

## Integration

The modal is automatically included in the authenticated layout (`AuthenticatedLayoutClient`) and will appear on any page when the token is expiring soon.

## Configuration

The warning threshold is set to 5 days before expiration. This can be modified in the `isTokenExpiringSoon` function in `src/lib/linkedin-token-utils.ts`.

## Testing

Run the tests with:

```bash
npm test linkedin-token-expiration-modal
```

## Notes

- LinkedIn access tokens typically expire after 60 days
- Refresh tokens are only available to select LinkedIn partners
- If no refresh token is available, users must reconnect their account
- The modal will reappear on each page load until the token is refreshed or the user reconnects
