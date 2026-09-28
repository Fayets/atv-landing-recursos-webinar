"""Las tres áreas del webinar. La URL de cada una es recursos.atvos.io/<slug>."""

from decouple import config
from fastapi import HTTPException

AREAS = {
    "marketing": {"nombre": "Marketing", "env": "PASSWORD_MARKETING"},
    "ventas": {"nombre": "Ventas", "env": "PASSWORD_VENTAS"},
    "back-end": {"nombre": "Back-end", "env": "PASSWORD_BACKEND"},
}


def get_area(slug: str) -> dict:
    area = AREAS.get(slug)
    if not area:
        raise HTTPException(status_code=404, detail="Área inexistente.")
    return area


def password_for(slug: str) -> str:
    """La contraseña que Juan dice en vivo. Se cambia en el .env sin redeployar el frontend."""
    area = get_area(slug)
    return config(area["env"], default="") or config("PASSWORD_DEFAULT", default="ATV")
