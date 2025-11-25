from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RoyaltyBase(BaseModel):
    departamento: Optional[str] = None
    municipio: Optional[str] = None
    campo: Optional[str] = None
    contrato: Optional[str] = None
    periodo: Optional[str] = None
    producto: Optional[str] = None
    tipo_regalia: Optional[str] = None
    valor_liquidado: Optional[float] = None

class Royalty(RoyaltyBase):
    id: int
    fecha_carga: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProductionBase(BaseModel):
    campo: Optional[str] = None
    operadora: Optional[str] = None
    departamento: Optional[str] = None
    municipio: Optional[str] = None
    anio: Optional[int] = None
    mes: Optional[int] = None
    produccion_mensual: Optional[float] = None

class Production(ProductionBase):
    id: int
    fecha_carga: Optional[datetime] = None

    class Config:
        from_attributes = True

class DemandBase(BaseModel):
    sector: Optional[str] = None
    region: Optional[str] = None
    anio: Optional[int] = None
    mes: Optional[int] = None
    escenario: Optional[str] = None
    demanda: Optional[float] = None

class Demand(DemandBase):
    id: int
    fecha_carga: Optional[datetime] = None

    class Config:
        from_attributes = True
