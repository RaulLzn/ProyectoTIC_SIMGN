from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List, Optional

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

# --- Royalties Endpoints ---
@router.get("/royalties", response_model=List[schemas.Royalty])
def get_royalties(
    response: Response,
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    tipo_hidrocarburo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Set browser cache for 1 hour
    response.headers["Cache-Control"] = "public, max-age=3600"
    
    query = db.query(models.Royalty)
    
    # Apply filters
    if departamento:
        query = query.filter(models.Royalty.departamento == departamento)
    if campo:
        query = query.filter(models.Royalty.campo == campo)
    if anio_min:
        query = query.filter(models.Royalty.anio >= anio_min)
    if anio_max:
        query = query.filter(models.Royalty.anio <= anio_max)
    if tipo_hidrocarburo:
        query = query.filter(models.Royalty.tipo_hidrocarburo == tipo_hidrocarburo)
    
    # Return ALL matching records - no limit
    royalties = query.all()
    return royalties

# ... (rest of file)

# --- Production Endpoints ---
@router.get("/production", response_model=List[schemas.Production])
def get_production(
    response: Response,
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    operadora: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Set browser cache for 1 hour
    response.headers["Cache-Control"] = "public, max-age=3600"

    query = db.query(models.Production)
    
    # Apply filters
    if departamento:
        query = query.filter(models.Production.departamento == departamento)
    if campo:
        query = query.filter(models.Production.campo == campo)
    if operadora:
        query = query.filter(models.Production.operadora == operadora)
    if anio_min:
        query = query.filter(models.Production.anio >= anio_min)
    if anio_max:
        query = query.filter(models.Production.anio <= anio_max)
    
    # Return ALL matching records - no limit
    production = query.all()
    return production

import time

# Simple in-memory cache
FILTER_CACHE = {
    "royalties": {"data": None, "timestamp": 0},
    "production": {"data": None, "timestamp": 0}
}
CACHE_TTL = 3600 * 24  # 24 hours

@router.get("/royalties/filters")
def get_royalties_filters(db: Session = Depends(get_db)):
    """Get available filter options for royalties (Cached)"""
    current_time = time.time()
    cached = FILTER_CACHE["royalties"]
    
    if cached["data"] and (current_time - cached["timestamp"] < CACHE_TTL):
        return cached["data"]

    departamentos = db.query(models.Royalty.departamento).distinct().all()
    campos = db.query(models.Royalty.campo).distinct().all()
    tipos_hidrocarburo = db.query(models.Royalty.tipo_hidrocarburo).distinct().all()
    anios = db.query(models.Royalty.anio).distinct().all()
    
    result = {
        "departamentos": sorted([d[0] for d in departamentos if d[0]]),
        "campos": sorted([c[0] for c in campos if c[0]]),
        "tipos_hidrocarburo": sorted([t[0] for t in tipos_hidrocarburo if t[0]]),
        "anios": sorted([a[0] for a in anios if a[0]])
    }
    
    FILTER_CACHE["royalties"] = {"data": result, "timestamp": current_time}
    return result

@router.get("/royalties/stats")
def get_royalties_stats(db: Session = Depends(get_db)):
    total_value = db.query(models.Royalty).with_entities(models.Royalty.valor_liquidado).all()
    total = sum([v[0] for v in total_value if v[0]])
    count = db.query(models.Royalty).count()
    return {"total_records": count, "total_value_liquidado": total}

# --- Production Endpoints ---
@router.get("/production", response_model=List[schemas.Production])
def get_production(
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    operadora: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Production)
    
    # Apply filters
    if departamento:
        query = query.filter(models.Production.departamento == departamento)
    if campo:
        query = query.filter(models.Production.campo == campo)
    if operadora:
        query = query.filter(models.Production.operadora == operadora)
    if anio_min:
        query = query.filter(models.Production.anio >= anio_min)
    if anio_max:
        query = query.filter(models.Production.anio <= anio_max)
    
    # Return ALL matching records - no limit
    production = query.all()
    return production

@router.get("/production/filters")
def get_production_filters(db: Session = Depends(get_db)):
    """Get available filter options for production (Cached)"""
    current_time = time.time()
    cached = FILTER_CACHE["production"]
    
    if cached["data"] and (current_time - cached["timestamp"] < CACHE_TTL):
        return cached["data"]

    departamentos = db.query(models.Production.departamento).distinct().all()
    campos = db.query(models.Production.campo).distinct().all()
    operadoras = db.query(models.Production.operadora).distinct().all()
    anios = db.query(models.Production.anio).distinct().all()
    
    result = {
        "departamentos": sorted([d[0] for d in departamentos if d[0]]),
        "campos": sorted([c[0] for c in campos if c[0]]),
        "operadoras": sorted([o[0] for o in operadoras if o[0]]),
        "anios": sorted([a[0] for a in anios if a[0]])
    }
    
    FILTER_CACHE["production"] = {"data": result, "timestamp": current_time}
    return result

@router.get("/production/stats")
def get_production_stats(db: Session = Depends(get_db)):
    total_prod = db.query(models.Production).with_entities(models.Production.produccion_mensual).all()
    total = sum([v[0] for v in total_prod if v[0]])
    count = db.query(models.Production).count()
    return {"total_records": count, "total_production_kpc": total}

# --- Demand Endpoints ---
@router.get("/demand", response_model=List[schemas.Demand])
def get_demand(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    demand = db.query(models.Demand).offset(skip).limit(limit).all()
    return demand

@router.get("/demand/stats")
def get_demand_stats(db: Session = Depends(get_db)):
    total_demand = db.query(models.Demand).with_entities(models.Demand.demanda).all()
    total = sum([v[0] for v in total_demand if v[0]])
    count = db.query(models.Demand).count()
    return {"total_records": count, "total_demand_gbtud": total}

