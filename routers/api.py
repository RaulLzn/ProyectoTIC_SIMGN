from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import List, Optional

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

# --- Royalties Endpoints ---
@router.get("/royalties", response_model=List[dict])
def get_royalties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Return as dicts for simplicity, or define Pydantic schemas
    royalties = db.query(models.Royalty).offset(skip).limit(limit).all()
    return royalties

@router.get("/royalties/stats")
def get_royalties_stats(db: Session = Depends(get_db)):
    total_value = db.query(models.Royalty).with_entities(models.Royalty.valor_liquidado).all()
    total = sum([v[0] for v in total_value if v[0]])
    count = db.query(models.Royalty).count()
    return {"total_records": count, "total_value_liquidado": total}

# --- Production Endpoints ---
@router.get("/production", response_model=List[dict])
def get_production(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    production = db.query(models.Production).offset(skip).limit(limit).all()
    return production

@router.get("/production/stats")
def get_production_stats(db: Session = Depends(get_db)):
    total_prod = db.query(models.Production).with_entities(models.Production.produccion_mensual).all()
    total = sum([v[0] for v in total_prod if v[0]])
    count = db.query(models.Production).count()
    return {"total_records": count, "total_production_kpc": total}

# --- Demand Endpoints ---
@router.get("/demand", response_model=List[dict])
def get_demand(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    demand = db.query(models.Demand).offset(skip).limit(limit).all()
    return demand

@router.get("/demand/stats")
def get_demand_stats(db: Session = Depends(get_db)):
    total_demand = db.query(models.Demand).with_entities(models.Demand.demanda).all()
    total = sum([v[0] for v in total_demand if v[0]])
    count = db.query(models.Demand).count()
    return {"total_records": count, "total_demand_gbtud": total}

