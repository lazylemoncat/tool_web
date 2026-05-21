/**
 * Maps API English error messages to i18n keys for user-friendly display.
 * Also handles Pydantic validation error fragments via pattern matching.
 */

const API_ERROR_TO_I18N: Record<string, string> = {
  "Username already exists": "errors.usernameTaken",
  "Invalid username or password": "errors.invalidCredentials",
  "Invalid or expired token": "errors.invalidToken",
  "User not found": "errors.userNotFound",
  "Current password is incorrect": "errors.wrongPassword",
  "Password is incorrect": "errors.wrongPassword",
  "Account locked": "errors.accountLocked",
  "Too many requests, please try again later": "errors.tooManyRequests",
  "Access denied": "errors.accessDenied",
  "Network error": "errors.networkError",
  "Request failed": "errors.unknownError",
}

// Pydantic validation error message fragments → i18n keys
const VALIDATION_FRAGMENT_TO_I18N: [RegExp, string][] = [
  [/password.*at least 8 characters/i, "errors.passwordTooShort"],
  [/password.*at most 100 characters/i, "errors.passwordTooLong"],
  [/password.*at least 1 letter and 1 digit/i, "errors.passwordWeak"],
  [/username.*at least 2 characters/i, "errors.usernameTooShort"],
  [/username.*at most 50 characters/i, "errors.usernameTooLong"],
  [/field required/i, "auth.fillRequired"],
]

const LOCKOUT_PATTERN = /^Account locked due to too many failed attempts, please try again in (\d+) minutes$/

const NOT_FOUND_PATTERN = /^(.+) not found$/

export interface MappedError {
  i18nKey: string
  vars?: Record<string, string>
}

/**
 * Map a raw API error message (English) to an i18n key.
 * Returns null if no mapping exists - caller should use the raw message as fallback.
 */
export function mapErrorMessage(raw: string): MappedError | null {
  if (!raw) return null

  // Exact match
  if (API_ERROR_TO_I18N[raw]) {
    return { i18nKey: API_ERROR_TO_I18N[raw] }
  }

  // Pydantic validation fragments (message may contain multiple errors joined by "; ")
  for (const [pattern, key] of VALIDATION_FRAGMENT_TO_I18N) {
    if (pattern.test(raw)) {
      return { i18nKey: key }
    }
  }

  // "Account locked due to too many failed attempts" pattern
  const lockoutMatch = raw.match(LOCKOUT_PATTERN)
  if (lockoutMatch) {
    return { i18nKey: "errors.accountLocked", vars: { n: lockoutMatch[1] } }
  }

  // "X not found" pattern
  const m = raw.match(NOT_FOUND_PATTERN)
  if (m) {
    return { i18nKey: "errors.notFound", vars: { entity: m[1] } }
  }

  return null
}
