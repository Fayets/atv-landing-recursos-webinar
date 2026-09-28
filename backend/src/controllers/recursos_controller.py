from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from src import schemas
from src.services.recursos_services import RecursosServices

router = APIRouter(prefix="/api/recursos")
service = RecursosServices()


@router.post("/{area}/unlock", response_model=schemas.UnlockResponse)
def unlock(area: str, body: schemas.UnlockRequest):
    try:
        return service.unlock(area, body.password)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Error inesperado al validar la contraseña.")


@router.post("/{area}/solicitudes", response_model=schemas.SolicitudResponse)
def crear_solicitud(area: str, body: schemas.SolicitudRequest):
    try:
        return service.crear_solicitud(area, body)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Error inesperado al guardar tus datos.")


@router.get("/{area}/whatsapp")
def whatsapp(area: str, s: Optional[int] = None, r: Optional[str] = None):
    """El candado apunta acá: se cuenta el click en el server y recién ahí se redirige."""
    try:
        return RedirectResponse(service.whatsapp_url(area, s, r), status_code=302)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Error inesperado al abrir WhatsApp.")
