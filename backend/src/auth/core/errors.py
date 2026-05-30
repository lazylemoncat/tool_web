"""Auth domain errors."""


class AuthError(Exception):
    status_code = 400
    code = "AUTH_ERROR"

    def __init__(self, message: str | None = None):
        super().__init__(message or self.code)
        self.message = message or self.code


class InvalidCredentialsError(AuthError):
    status_code = 401
    code = "INVALID_CREDENTIALS"

    def __init__(self):
        super().__init__("Invalid username or password")


class InvalidTokenError(AuthError):
    status_code = 401
    code = "TOKEN_INVALID"

    def __init__(self):
        super().__init__("Invalid or expired token")


class SessionRevokedError(AuthError):
    status_code = 401
    code = "SESSION_REVOKED"

    def __init__(self):
        super().__init__("Session revoked")


class UserNotFoundError(AuthError):
    status_code = 401
    code = "USER_NOT_FOUND"

    def __init__(self):
        super().__init__("User not found")


class AccountLockedError(AuthError):
    status_code = 423
    code = "ACCOUNT_LOCKED"

    def __init__(self, remaining_minutes: int):
        super().__init__(
            f"Account locked due to too many failed attempts, please try again in {remaining_minutes} minutes"
        )


class UsernameExistsError(AuthError):
    status_code = 409
    code = "USERNAME_EXISTS"

    def __init__(self):
        super().__init__("Username already exists")


class WeakPasswordError(AuthError):
    status_code = 422
    code = "PASSWORD_TOO_WEAK"


class CurrentPasswordInvalidError(AuthError):
    status_code = 400
    code = "CURRENT_PASSWORD_INVALID"

    def __init__(self):
        super().__init__("Current password is incorrect")


class DeletePasswordInvalidError(AuthError):
    status_code = 400
    code = "PASSWORD_INVALID"

    def __init__(self):
        super().__init__("Password is incorrect")


class CsrfInvalidError(AuthError):
    status_code = 403
    code = "CSRF_INVALID"

    def __init__(self):
        super().__init__("CSRF token is invalid")


class MfaRequiredError(AuthError):
    status_code = 202
    code = "MFA_REQUIRED"


class MfaInvalidError(AuthError):
    status_code = 401
    code = "MFA_CODE_INVALID"

    def __init__(self):
        super().__init__("MFA code is invalid")
