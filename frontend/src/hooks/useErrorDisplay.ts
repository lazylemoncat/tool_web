/**
 * Hook that combines i18n translation with API error message mapping.
 * Converts raw API English error messages into user-friendly localized text.
 */

import { useLocale } from "../i18n"
import { mapErrorMessage } from "../utils/errorMapping"

export function useErrorDisplay() {
  const { t } = useLocale()

  function displayError(err: unknown): string {
    if (err instanceof Error) {
      const mapped = mapErrorMessage(err.message)
      if (mapped) {
        return t(mapped.i18nKey, mapped.vars)
      }
      // No mapping found: return raw message as fallback
      return err.message
    }
    return t("errors.unknownError")
  }

  return { displayError }
}
