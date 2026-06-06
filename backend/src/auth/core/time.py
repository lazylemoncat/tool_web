"""UTC time helpers used by auth services and models."""

from datetime import UTC, datetime


def utcnow() -> datetime:
    """Return a timezone-aware UTC datetime."""
    return datetime.now(UTC)


def ensure_aware_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
