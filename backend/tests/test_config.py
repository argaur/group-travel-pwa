"""Settings that production behaviour depends on."""
from config import Settings

REQUIRED = dict(database_url="postgresql://x", anthropic_api_key="k", secret_key="s", nextauth_secret="n")


def test_pool_defaults_allow_concurrent_requests():
    s = Settings(**REQUIRED)
    assert s.db_pool_size >= 5 and s.db_max_overflow >= 5


def test_env_allowed_origins_never_drops_the_custom_domain():
    # Railway sets ALLOWED_ORIGINS, which used to replace the built-in list entirely.
    s = Settings(**REQUIRED, allowed_origins="https://only-this.example")
    assert "https://only-this.example" in s.origins_list
    assert "https://trivo.gauravg.dev" in s.origins_list
    assert "https://trivo-argaur.vercel.app" in s.origins_list


def test_origins_are_deduplicated_and_trimmed():
    s = Settings(**REQUIRED, allowed_origins=" https://trivo.gauravg.dev , https://a.example ,")
    assert s.origins_list.count("https://trivo.gauravg.dev") == 1
    assert "" not in s.origins_list
