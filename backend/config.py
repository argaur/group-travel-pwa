from pydantic_settings import BaseSettings
from functools import lru_cache


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

    allowed_origins: str = (
        "http://localhost:3000,"
        "https://frontend-rmrv09xjy-argaurs-projects.vercel.app,"
        "https://frontend-lovat-phi-52.vercel.app,"
        "https://frontend-argaurs-projects.vercel.app"
    )

    # Google Places API (optional — demo sample data when empty)
    google_maps_api_key: str = ""

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
