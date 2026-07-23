"""Unit tests for the HMAC invite-token crypto (services.invite_tokens)."""
import time

import pytest

from services.invite_tokens import make_invite_token, verify_invite_token

TRIP = "11111111-1111-1111-1111-111111111111"
SECRET = "unit-test-secret"


def test_round_trip_returns_payload():
    token = make_invite_token(TRIP, SECRET)
    payload = verify_invite_token(token, TRIP, SECRET)
    assert payload["trip_id"] == TRIP
    assert "exp" in payload


def test_token_has_two_dot_separated_parts():
    token = make_invite_token(TRIP, SECRET)
    assert token.count(".") == 1
    assert all(part for part in token.split("."))


def test_tampered_signature_rejected():
    token = make_invite_token(TRIP, SECRET)
    body, sig = token.split(".")
    tampered = f"{body}.{'0' * len(sig)}"
    with pytest.raises(ValueError):
        verify_invite_token(tampered, TRIP, SECRET)


def test_tampered_payload_rejected():
    token = make_invite_token(TRIP, SECRET)
    body, sig = token.split(".")
    # Flip a character in the payload; signature no longer matches.
    flipped = ("A" if body[0] != "A" else "B") + body[1:]
    with pytest.raises(ValueError):
        verify_invite_token(f"{flipped}.{sig}", TRIP, SECRET)


def test_wrong_trip_id_rejected():
    token = make_invite_token(TRIP, SECRET)
    with pytest.raises(ValueError):
        verify_invite_token(token, "22222222-2222-2222-2222-222222222222", SECRET)


def test_wrong_secret_rejected():
    token = make_invite_token(TRIP, SECRET)
    with pytest.raises(ValueError):
        verify_invite_token(token, TRIP, "attacker-secret")


def test_expired_token_rejected():
    issued = int(time.time()) - 10_000
    token = make_invite_token(TRIP, SECRET, ttl_seconds=100, now=issued)
    with pytest.raises(ValueError):
        verify_invite_token(token, TRIP, SECRET)


def test_valid_within_ttl():
    now = 1_000_000
    token = make_invite_token(TRIP, SECRET, ttl_seconds=3600, now=now)
    payload = verify_invite_token(token, TRIP, SECRET, now=now + 3599)
    assert payload["trip_id"] == TRIP


def test_exp_equal_to_now_is_not_expired():
    now = 1_000_000
    token = make_invite_token(TRIP, SECRET, ttl_seconds=0, now=now)
    # exp == now; expiry rule is exp < now, so this is still valid.
    payload = verify_invite_token(token, TRIP, SECRET, now=now)
    assert payload["exp"] == now


def test_malformed_no_separator_rejected():
    with pytest.raises(ValueError):
        verify_invite_token("not-a-valid-token", TRIP, SECRET)


def test_malformed_too_many_parts_rejected():
    with pytest.raises(ValueError):
        verify_invite_token("a.b.c", TRIP, SECRET)


def test_malformed_base64_payload_rejected():
    with pytest.raises(ValueError):
        verify_invite_token("!!!not-base64!!!.deadbeef", TRIP, SECRET)
