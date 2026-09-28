import os

from decouple import config
from pony.orm import Database

db = Database()

DB_SCHEMA = config("DB_SCHEMA", default="recursos")
DB_PROVIDER = config("DB_PROVIDER", default="sqlite").lower().strip()


def _postgres_kwargs() -> dict:
    kw = dict(
        user=config("DB_USER"),
        password=config("DB_PASS"),
        host=config("DB_HOST"),
        dbname=config("DB_NAME"),
        port=config("DB_PORT", default=5432, cast=int),
    )
    sslmode = (config("DB_SSLMODE", default="") or "").strip()
    if sslmode:
        kw["sslmode"] = sslmode
    return kw


if DB_PROVIDER in {"postgres", "postgresql"}:
    _kw = _postgres_kwargs()
    _kw["database"] = _kw.pop("dbname")
    db.bind(provider="postgres", **_kw)
else:
    db.bind(
        provider="sqlite",
        # Pony resuelve rutas relativas contra src/: se ancla a backend/.
        filename=os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            config("DB_FILENAME", default="recursos.sqlite"),
        ),
        create_db=True,
    )


def _ensure_schema() -> None:
    if DB_PROVIDER not in {"postgres", "postgresql"}:
        return
    import psycopg2

    conn = psycopg2.connect(**_postgres_kwargs())
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"')
    finally:
        conn.close()


def init_db() -> None:
    """Registra entidades y crea schema/tablas."""
    import src.models  # noqa: F401

    _ensure_schema()
    if db.entities:
        db.generate_mapping(create_tables=True)


def table(name: str):
    """Nombre de tabla: con schema propio en postgres, plano en sqlite."""
    if DB_PROVIDER in {"postgres", "postgresql"}:
        return (DB_SCHEMA, name)
    return name
