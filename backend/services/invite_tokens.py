"""Signed invite-token crypto — pure, dependency-free, unit-tested.

An invite token is ``base64url(payload_json) + "." + hmac_sha256_hex``. The
payload binds the token to a ``trip_id`` and an expiry. Verification is
constant-time and rejects tampering, expiry, and trip mismatch.

The signing secret is injected by the caller so this module never imports app
config — keeping it a pure function that is trivial to test.
"""
from __future__ import annotations

import base64
import hmac
import json
import time

_DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60


def make_invite_token(
    trip_id: str,
    secret: str,
    ttl_seconds: int = _DEFAULT_TTL_SECONDS,
    now: int | None = None,
) -> str:
    """Create a signed, expiring invite token for ``trip_id``."""
    issued = int(time.time()) if now is None else int(now)
    payload = {"trip_id": trip_id, "exp": issued + ttl_seconds}
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signature = hmac.new(
        secret.encode("utf-8"),
        payload_json.encode("utf-8"),
        "sha256",
    ).hexdigest()
    token = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("utf-8").rstrip("=")
    return f"{token}.{signature}"


def verify_invite_token(
    token: str,
    trip_id: str,
    secret: str,
    now: int | None = None,
) -> dict:
    """Verify a token against ``trip_id`` and ``secret``.

    Returns the decoded payload dict on success. Raises ``ValueError`` on a
    malformed token, bad signature, trip mismatch, or expiry.
    """
    parts = token.split(".")
    if len(parts) != 2:
        raise ValueError("Malformed token")
    token_part, signature = parts

    padded = token_part + "=" * (-len(token_part) % 4)
    try:
        payload_json = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
    except Exception as exc:  # noqa: BLE001 — surfaced as ValueError below
        raise ValueError("Malformed token payload") from exc

    expected = hmac.new(
        secret.encode("utf-8"),
        payload_json.encode("utf-8"),
        "sha256",
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise ValueError("Invalid signature")

    payload = json.loads(payload_json)
    if payload.get("trip_id") != trip_id:
        raise ValueError("Trip mismatch")

    current = int(time.time()) if now is None else int(now)
    if int(payload.get("exp", 0)) < current:
        raise ValueError("Expired")

    return payload
