import hmac
import re
from urllib.parse import quote

from decouple import config
from fastapi import HTTPException
from datetime import datetime, timedelta

from pony.orm import db_session, desc, select

from src import schemas
from src.areas import get_area, password_for
from src.models import Desbloqueo, Solicitud


def _normalizar(texto: str) -> str:
    return texto.strip().upper()


class RecursosServices:
    @db_session
    def unlock(self, slug: str, password: str) -> schemas.UnlockResponse:
        esperada = _normalizar(password_for(slug))
        if not hmac.compare_digest(esperada.encode(), _normalizar(password).encode()):
            raise HTTPException(status_code=401, detail="Esa no es la contraseña. Escuchá a Juan 👀")
        Desbloqueo(area=slug)
        return schemas.UnlockResponse(ok=True)

    @db_session
    def crear_solicitud(self, slug: str, body: schemas.SolicitudRequest) -> schemas.SolicitudResponse:
        get_area(slug)
        digitos = re.sub(r"\D", "", body.telefono)
        if len(digitos) < 8:
            raise HTTPException(status_code=422, detail="Revisá el número: le faltan dígitos.")
        # Si el mismo número ya la mandó hace poco (reintento, doble toque), se actualiza esa.
        desde = datetime.utcnow() - timedelta(minutes=30)
        previas = select(
            x for x in Solicitud if x.area == slug and x.telefono == body.telefono.strip() and x.created_at >= desde
        ).order_by(desc(Solicitud.id))[:1]
        if previas:
            solicitud = previas[0]
            solicitud.cuello = body.cuello.strip()
            solicitud.intento = body.intento.strip()
        else:
            solicitud = Solicitud(
                area=slug,
                telefono=body.telefono.strip(),
                cuello=body.cuello.strip(),
                intento=body.intento.strip(),
            )
        solicitud.flush()
        return schemas.SolicitudResponse(id=solicitud.id)

    @db_session
    def whatsapp_url(self, slug: str, solicitud_id: int | None, recurso: str | None) -> str:
        """Suma el click (si viene de una solicitud) y arma el link al chat de Juan."""
        area = get_area(slug)
        if solicitud_id:
            solicitud = Solicitud.get(id=solicitud_id, area=slug)
            if solicitud:
                solicitud.whatsapp_clicks += 1
        numero = re.sub(r"\D", "", config("WHATSAPP_NUMBER", default=""))
        if not numero:
            raise HTTPException(status_code=503, detail="Falta configurar WHATSAPP_NUMBER.")
        # El nombre del SOP tocado; el botón general pide los del área.
        nombre = " ".join((recurso or "").split())[:120] or f"los SOPs de {area['nombre']}"
        return f"https://wa.me/{numero}?text={quote(f'Juan, quiero desbloquear {nombre}')}"
