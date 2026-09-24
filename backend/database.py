from typing import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import get_settings

settings = get_settings()


def _normalize_asyncpg_url(raw_url: str) -> str:
    url = raw_url
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]

    parsed = urlparse(url)
    scheme = parsed.scheme
    if scheme in {"postgresql", "postgresql+psycopg", "postgresql+psycopg2"}:
        scheme = "postgresql+asyncpg"

    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    sslmode = None
    filtered_pairs = []
    has_ssl = False
    libpq_only_params = {"channel_binding"}

    for key, value in query_pairs:
        if key == "sslmode":
            sslmode = value
            continue
        if key in libpq_only_params:
            continue
        if key == "ssl":
            has_ssl = True
        filtered_pairs.append((key, value))

    if sslmode and not has_ssl:
        filtered_pairs.append(("ssl", sslmode))

    normalized_query = urlencode(filtered_pairs)
    return urlunparse(parsed._replace(scheme=scheme, query=normalized_query))

engine = create_async_engine(
    _normalize_asyncpg_url(settings.database_url),
    echo=False,
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
