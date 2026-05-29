# Account And Authentication Help

## Feature Groups

Authentication covers registration, login, session persistence, logout, password changes, and account deletion.

## Register

1. Open the login page.
2. Click **Register**.
3. Enter username and password.
4. Click **Register**.

After successful registration, you are logged in automatically.

## Login

1. Open the login page.
2. Enter username and password.
3. Optionally enable **Remember me**.
4. Click **Login**.

After login, the app opens the home page. API requests attach the auth token automatically.

## Remember Me

- Keeps the login session available longer.
- If disabled, the session is closer to the current browser session.

## Show Or Hide Password

- Click the eye button beside a password field.
- This only changes visibility for the current input.

## Logout

1. Click the user or logout entry in the app.
2. Confirm logout.
3. The app returns to the unauthenticated state.

## Change Password

1. Go to **Settings > Account > Change Password**.
2. Enter the old password.
3. Enter and confirm the new password.
4. Save.

If the new passwords do not match, the page shows an error.

## Delete Account

1. Go to **Settings > Account > Delete Account**.
2. Read the warning.
3. Enter your password to confirm identity.
4. Confirm deletion.

Account deletion permanently removes the account and related data.

## Security Notes

- Passwords are stored encrypted by the backend.
- Login uses JWT tokens.
- All non-auth API endpoints require a valid token.
- The frontend attaches tokens automatically.
