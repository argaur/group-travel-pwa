from pydantic_settings import BaseSettings
from functools import lru_cache


BUILTIN_ORIGINS = [
    "http://localhost:3000",
    "https://frontend-rmrv09xjy-argaurs-projects.vercel.app",
    "https://frontend-lovat-phi-52.vercel.app",
    "https://frontend-argaurs-projects.vercel.app",
    "https://trivo-argaur.vercel.app",
    "https://trivo.gauravg.dev",
]


class Settings(BaseSettings):
    database_url: str
    anthropic_api_key: str
    secret_key: str
    nextauth_secret: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claims_email: str = ""

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    # Connection pool. Defaults suit a long-lived process (Railway, local dev). On a
    # serverless host set DB_POOL_SIZE=1 and DB_MAX_OVERFLOW=0: each invocation gets its
    # own pool, so a large one multiplies against Neon's connection limit.
    db_pool_size: int = 5
    db_max_overflow: int = 5

    # Extra origins to allow, comma-separated. Always added to BUILTIN_ORIGINS, never a
    # replacement for them: a host that sets this variable used to lose every built-in origin.
    allowed_origins: str = ""

    # Google Places API (optional — demo sample data when empty)
    google_maps_api_key: str = ""

    # Error tracking (optional — Sentry is disabled when empty)
    sentry_dsn: str = ""

    # Upstash Redis (SSE pub/sub — replaces the old in-memory asyncio.Queue,
    # which can't survive Vercel's stateless/multi-instance functions).
    # Auto-injected as env vars once Upstash is added from the Vercel
    # dashboard's Storage tab.
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""

    @property
    def origins_list(self) -> list[str]:
        extra = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        return list(dict.fromkeys([*BUILTIN_ORIGINS, *extra]))

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
