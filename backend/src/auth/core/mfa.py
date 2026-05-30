"""TOTP and recovery-code helpers."""

import base64
import hashlib
import hmac
import secrets
import struct
import time


def generate_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")


def _hotp(secret: str, counter: int, digits: int) -> str:
    padded = secret + "=" * ((8 - len(secret) % 8) % 8)
    key = base64.b32decode(padded, casefold=True)
    msg = struct.pack(">Q", counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code_int = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return str(code_int % (10**digits)).zfill(digits)


def current_time_step(interval_seconds: int) -> int:
    return int(time.time() // interval_seconds)


def verify_totp(
    *,
    secret: str,
    code: str,
    digits: int,
    interval_seconds: int,
    valid_window: int,
) -> tuple[bool, int | None]:
    if not code.isdigit() or len(code) != digits:
        return False, None
    current = current_time_step(interval_seconds)
    for step in range(current - valid_window, current + valid_window + 1):
        if hmac.compare_digest(_hotp(secret, step, digits), code):
            return True, step
    return False, None


def build_otpauth_uri(*, issuer: str, username: str, secret: str) -> str:
    label = f"{issuer}:{username}"
    return f"otpauth://totp/{label}?secret={secret}&issuer={issuer}"


def generate_recovery_code(length: int) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def hash_secret(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()
