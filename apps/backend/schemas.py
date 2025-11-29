from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RoyaltyBase(BaseModel):
    departamento: Optional[str] = None
    municipio: Optional[str] = None
    campo: Optional[str] = None
    contrato: Optional[str] = None
    anio: Optional[int] = None
    mes: Optional[int] = None
    
    volumen_regalia: Optional[float] = None
    trm_promedio: Optional[float] = None
    tipo_prod: Optional[str] = None
    tipo_hidrocarburo: Optional[str] = None
    regimen: Optional[str] = None
    prod_gravable: Optional[float] = None
    precio_usd: Optional[float] = None
    porc_regalia: Optional[float] = None
    
    longitud: Optional[float] = None
    latitud: Optional[float] = None
    
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
