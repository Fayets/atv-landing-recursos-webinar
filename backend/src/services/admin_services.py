import csv
import io

from pony.orm import count, db_session, delete, desc, select

from src import schemas
from src.areas import AREAS
from src.models import Desbloqueo, Solicitud


class AdminServices:
    @db_session
    def resumen(self) -> schemas.AdminResponse:
        areas = [
            schemas.AreaStats(
                area=slug,
                desbloqueos=count(d for d in Desbloqueo if d.area == slug),
                solicitudes=count(s for s in Solicitud if s.area == slug),
                whatsapp=count(s for s in Solicitud if s.area == slug and s.whatsapp_clicks > 0),
            )
            for slug in AREAS
        ]
        filas = select(s for s in Solicitud).order_by(desc(Solicitud.id))[:]
        items = [
            schemas.SolicitudItem(
                id=s.id,
                area=s.area,
                telefono=s.telefono,
                cuello=s.cuello,
                intento=s.intento,
                whatsapp_clicks=s.whatsapp_clicks,
                created_at=s.created_at,
            )
            for s in filas
        ]
        return schemas.AdminResponse(
            areas=areas,
            solicitudes=items,
            ultima=items[0].created_at if items else None,
        )

    @db_session
    def reset(self) -> dict:
        """Borra desbloqueos y solicitudes: para dejar el panel en cero antes del vivo."""
        borradas = {"desbloqueos": delete(d for d in Desbloqueo), "solicitudes": delete(s for s in Solicitud)}
        return borradas

    @staticmethod
    def _celda(valor):
        # Excel ejecuta como fórmula lo que empieza con = + - @: se neutraliza con un apóstrofe.
        texto = str(valor)
        return "'" + texto if texto[:1] in ("=", "+", "-", "@", "\t", "\r") else texto

    def csv(self) -> str:
        data = self.resumen()
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(["id", "area", "telefono", "cuello_de_botella", "que_intento", "clicks_whatsapp", "fecha_utc"])
        for s in data.solicitudes:
            writer.writerow([s.id, s.area, self._celda(s.telefono), self._celda(s.cuello), self._celda(s.intento), s.whatsapp_clicks, s.created_at.isoformat()])
        return "﻿" + out.getvalue()
