import hmac

from decouple import config
from fastapi import Header, HTTPException


def require_admin(x_admin_pin: str = Header(default="")) -> None:
    pin = config("ADMIN_PIN", default="")
    if not pin or not hmac.compare_digest(pin, x_admin_pin):
        raise HTTPException(status_code=401, detail="PIN incorrecto.")
