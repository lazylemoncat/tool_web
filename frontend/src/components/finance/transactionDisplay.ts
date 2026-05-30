export function formatTransactionTitle(categoryName: string | null | undefined, note: string | null | undefined, fallback: string): string {
  const normalizedCategory = categoryName?.trim()
  const normalizedNote = note?.trim()
  if (normalizedCategory && normalizedNote) return `${normalizedCategory} · ${normalizedNote}`
  if (normalizedCategory) return normalizedCategory
  if (normalizedNote) return normalizedNote
  return fallback
}
