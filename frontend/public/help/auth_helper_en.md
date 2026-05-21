# Authentication

## Register

1. Switch to register mode on the login page
2. Enter username and password
3. Click the register button

You will be automatically logged in after registration.

## Login

Enter your registered username and password, then click login.

## Logout

1. Click your username button at the bottom of the sidebar
2. Click logout in the confirmation dialog

## Security

- Passwords are stored using bcrypt hashing
- JWT tokens are used for authentication
- Tokens are stored in browser localStorage
- API requests automatically include the token
