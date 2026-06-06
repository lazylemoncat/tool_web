"""Simple in-memory rate limiter adapter."""

import time
from collections import defaultdict


class InMemoryRateLimiter:
    def __init__(self):
        self._attempts: dict[str, list[float]] = defaultdict(list)

    def hit(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        self._attempts[key] = [t for t in self._attempts[key] if t > cutoff]
        allowed = len(self._attempts[key]) < limit
        if allowed:
            self._attempts[key].append(now)
        if not self._attempts[key]:
            del self._attempts[key]
        return allowed

    def clear(self) -> None:
        self._attempts.clear()
