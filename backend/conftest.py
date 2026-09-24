"""Shared test setup.

Sets dummy env vars *before* any app module is imported, so importing modules
that read settings at import time (e.g. ``config``, ``database``, ``services.ai``)
never fails for lack of a real environment. None of these values touch a live
service during unit/eval runs — the DB engine is created lazily and the Anthropic
client is monkeypatched in the eval suite.
"""
import os

from dotenv import load_dotenv

# Load .env *before* the dummy setdefaults below, so RUN_LIVE_EVALS=1 actually
# uses a real ANTHROPIC_API_KEY when one is present in the environment — a
# plain setdefault() here would otherwise always win, since services.ai's own
# load_dotenv() call (later, at import time) never overrides an existing var.
load_dotenv()

os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/test"
)
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-not-used")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("NEXTAUTH_SECRET", "test-nextauth-secret")
