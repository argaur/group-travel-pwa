"""Shared test setup.

Sets dummy env vars *before* any app module is imported, so importing modules
that read settings at import time (e.g. ``config``, ``database``, ``services.ai``)
never fails for lack of a real environment. None of these values touch a live
service during unit/eval runs — the DB engine is created lazily and the Anthropic
client is monkeypatched in the eval suite.
"""
import os

os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/test"
)
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-not-used")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("NEXTAUTH_SECRET", "test-nextauth-secret")
