from fastapi import APIRouter, HTTPException

from src import schemas
from src.services.health_services import HealthServices

router = APIRouter()
service = HealthServices()


@router.get("/health", response_model=schemas.HealthResponse)
def get_health():
    try:
        return service.get_health()
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Error inesperado al consultar el estado.")
