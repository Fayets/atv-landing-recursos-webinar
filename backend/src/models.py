from datetime import datetime

from pony.orm import Optional, PrimaryKey, Required

from src.db import db, table


class Desbloqueo(db.Entity):
    """Cada vez que alguien pone bien la contraseña: mide cuántos se quedaron a escucharla."""

    _table_ = table("desbloqueos")
    id = PrimaryKey(int, auto=True)
    area = Required(str)
    created_at = Required(datetime, default=datetime.utcnow)


class Solicitud(db.Entity):
    _table_ = table("solicitudes")
    id = PrimaryKey(int, auto=True)
    area = Required(str)
    telefono = Required(str)
    cuello = Required(str)
    intento = Optional(str, default="")
    whatsapp_clicks = Required(int, default=0)
    created_at = Required(datetime, default=datetime.utcnow)


class IntentoAdmin(db.Entity):
    """PIN incorrecto en /admin: para frenar a quien prueba PINs en serie."""

    _table_ = table("intentos_admin")
    id = PrimaryKey(int, auto=True)
    ip = Required(str)
    created_at = Required(datetime, default=datetime.utcnow)


class DescargaGratis(db.Entity):
    """Cada vez que alguien abre uno de los 2 SOPs gratis de su área."""

    _table_ = table("descargas_gratis")
    id = PrimaryKey(int, auto=True)
    area = Required(str)
    recurso = Required(str)
    solicitud_id = Required(int)
    created_at = Required(datetime, default=datetime.utcnow)
