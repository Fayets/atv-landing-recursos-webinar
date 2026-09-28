from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from src import schemas
from src.admin_auth import require_admin
from src.services.admin_services import AdminServices

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])
service = AdminServices()


@router.get("/solicitudes", response_model=schemas.AdminResponse)
def get_solicitudes():
    try:
        return service.resumen()
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Error inesperado al listar solicitudes.")


@router.get("/solicitudes.csv")
def get_solicitudes_csv():
    try:
        return Response(
            content=service.csv(),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": 'attachment; filename="solicitudes-recursos.csv"'},
        )
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Error inesperado al exportar.")
