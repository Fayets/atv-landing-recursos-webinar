from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str


class UnlockRequest(BaseModel):
    password: str = Field(default="", max_length=100)


class UnlockResponse(BaseModel):
    ok: bool


class SolicitudRequest(BaseModel):
    telefono: str = Field(min_length=6, max_length=40)
    cuello: str = Field(min_length=1, max_length=300)
    intento: str = Field(default="", max_length=2000)


class SolicitudResponse(BaseModel):
    id: int


class SolicitudItem(BaseModel):
    id: int
    area: str
    telefono: str
    cuello: str
    intento: str
    whatsapp_clicks: int
    created_at: datetime


class AreaStats(BaseModel):
    area: str
    desbloqueos: int
    solicitudes: int
    whatsapp: int


class AdminResponse(BaseModel):
    areas: list[AreaStats]
    solicitudes: list[SolicitudItem]
    ultima: Optional[datetime] = None
