import hmac
from datetime import datetime, timedelta

from decouple import config
from fastapi import Header, HTTPException, Request
from pony.orm import commit, count, db_session

from src.models import IntentoAdmin

MAX_FALLOS = 8
VENTANA = timedelta(minutes=15)


def ip_cliente(request: Request) -> str:
    # El nginx del host pone la IP real y el del contenedor la pasa tal cual; el backend
    # no es alcanzable desde afuera, así que el header es confiable.
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "?")


@db_session
def require_admin(request: Request, x_admin_pin: str = Header(default="")) -> None:
    ip = ip_cliente(request)
    desde = datetime.utcnow() - VENTANA
    if count(i for i in IntentoAdmin if i.ip == ip and i.created_at >= desde) >= MAX_FALLOS:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Probá de nuevo en 15 minutos.")
    pin = config("ADMIN_PIN", default="")
    if not pin or not hmac.compare_digest(pin.encode(), x_admin_pin.encode()):
        IntentoAdmin(ip=ip)
        commit()  # el db_session deshace todo al salir con excepción: el intento se guarda antes
        raise HTTPException(status_code=401, detail="PIN incorrecto.")
