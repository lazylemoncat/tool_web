# Adding a New Language

1. Copy `en.json` to `<lang>.json` (e.g. `ko.json`, `ja.json`)
2. Translate all values (keep keys unchanged)
3. Add the locale to the `Locale` type in `src/i18n.tsx`
4. Add the language option in `SettingsPage.tsx`

No other code changes needed.
