"""Pase que da la contraseña correcta: firmado, por área y con vencimiento.

Sin él no se puede mandar el formulario ni sumar clicks, así que tocar el localStorage
del navegador ya no alcanza para saltarse la contraseña. La firma incluye la contraseña
vigente: si Juan la cambia, los pases viejos dejan de valer.
"""

import base64
import hashlib
import hmac
import time

from decouple import config
from fastapi import HTTPException

from src.areas import password_for

DURACION = 12 * 3600


def _clave(slug: str) -> bytes:
    secreto = config("RECURSOS_SECRET", default="") or (
        # respaldo determinístico: los 4 procesos tienen que firmar igual
        config("ADMIN_PIN", default="") + config("DB_PASS", default="") + config("DB_HOST", default="")
    )
    return hashlib.sha256(f"{secreto}|{password_for(slug)}|{slug}".encode()).digest()


def emitir(slug: str) -> str:
    vence = str(int(time.time()) + DURACION)
    firma = hmac.new(_clave(slug), vence.encode(), hashlib.sha256).digest()
    return f"{vence}.{base64.urlsafe_b64encode(firma).decode().rstrip('=')}"


def valido(slug: str, pase: str | None) -> bool:
    try:
        vence, firma = (pase or "").split(".", 1)
        if int(vence) < time.time():
            return False
        esperada = base64.urlsafe_b64encode(hmac.new(_clave(slug), vence.encode(), hashlib.sha256).digest()).decode().rstrip("=")
        return hmac.compare_digest(esperada, firma)
    except (ValueError, TypeError):
        return False


def exigir(slug: str, pase: str | None) -> None:
    if not valido(slug, pase):
        raise HTTPException(status_code=401, detail="Tu acceso venció. Volvé a poner la contraseña.")
