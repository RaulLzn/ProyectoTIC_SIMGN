from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
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

# --- Aggregation Endpoints (Low RAM Strategy) ---

@router.get("/production/kpis")
def get_production_kpis(
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    operadora: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get calculated KPIs directly from DB to save RAM"""
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
    
    # Calculate KPIs in DB
    from sqlalchemy import func, distinct
    
    stats = query.with_entities(
        func.sum(models.Production.produccion_mensual).label('total_production'),
        func.count(distinct(models.Production.campo)).label('active_fields'),
        func.count(distinct(models.Production.operadora)).label('active_operators'),
        func.avg(models.Production.produccion_mensual).label('avg_monthly')
    ).first()
    
    return {
        "totalProduction": stats.total_production or 0,
        "activeFields": stats.active_fields or 0,
        "activeOperators": stats.active_operators or 0,
        "averageMonthly": stats.avg_monthly or 0
    }

@router.get("/production/trend")
def get_production_trend(
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    operadora: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get time series data aggregated by date"""
    query = db.query(models.Production)
    
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
        
    from sqlalchemy import func
    
    # Group by Year/Month
    # Note: We assume anio/mes columns exist. 
    # For a proper date sort, we might need to construct a date object or sort by anio, mes.
    results = query.with_entities(
        models.Production.anio,
        models.Production.mes,
        func.sum(models.Production.produccion_mensual).label('total')
    ).group_by(models.Production.anio, models.Production.mes).order_by(models.Production.anio, models.Production.mes).all()
    
    return [
        {
            "year": r.anio,
            "month": r.mes,
            "total": r.total
        }
        for r in results
    ]

@router.get("/production/ranking")
def get_production_ranking(
    type: str, # 'operadora' or 'campo'
    limit: int = 15,
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    operadora: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get top N items by production"""
    query = db.query(models.Production)
    
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
        
    from sqlalchemy import func, desc
    
    group_col = models.Production.operadora if type == 'operadora' else models.Production.campo
    
    results = query.with_entities(
        group_col.label('name'),
        func.sum(models.Production.produccion_mensual).label('total')
    ).group_by(group_col).order_by(desc('total')).limit(limit).all()
    
    return [
        {
            "name": r.name,
            "value": r.total
        }
        for r in results
    ]

@router.get("/production/map")
def get_production_map(
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    operadora: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get aggregated production data by department for map"""
    query = db.query(models.Production)
    
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
        
    from sqlalchemy import func
    
    results = query.with_entities(
        models.Production.departamento,
        func.sum(models.Production.produccion_mensual).label('total')
    ).group_by(models.Production.departamento).all()
    
    return [
        {
            "department": r.departamento,
            "value": r.total
        }
        for r in results
    ]
    
# --- Royalties Aggregation Endpoints ---

@router.get("/royalties/kpis")
def get_royalties_kpis(
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    tipo_hidrocarburo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get calculated KPIs for Royalties directly from DB"""
    query = db.query(models.Royalty)
    
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
        
    from sqlalchemy import func, distinct
    
    stats = query.with_entities(
        func.sum(models.Royalty.valor_liquidado).label('total_amount'),
        func.sum(models.Royalty.volumen_regalia).label('total_volume'),
        func.avg(models.Royalty.precio_usd).label('avg_price'),
        func.count(distinct(models.Royalty.municipio)).label('municipalities')
    ).first()
    
    return {
        "totalAmount": stats.total_amount or 0,
        "totalVolume": stats.total_volume or 0,
        "avgPriceUsd": stats.avg_price or 0,
        "municipalities": stats.municipalities or 0
    }

@router.get("/royalties/trend")
def get_royalties_trend(
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    tipo_hidrocarburo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get time series data for Royalties"""
    query = db.query(models.Royalty)
    
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
        
    from sqlalchemy import func
    
    results = query.with_entities(
        models.Royalty.anio,
        models.Royalty.mes,
        func.sum(models.Royalty.valor_liquidado).label('valor'),
        func.sum(models.Royalty.volumen_regalia).label('volumen'),
        func.avg(models.Royalty.precio_usd).label('precio')
    ).group_by(models.Royalty.anio, models.Royalty.mes).order_by(models.Royalty.anio, models.Royalty.mes).all()
    
    return [
        {
            "year": r.anio,
            "month": r.mes,
            "valor": r.valor,
            "volumen": r.volumen,
            "precio": r.precio
        }
        for r in results
    ]

@router.get("/royalties/map")
def get_royalties_map(
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    tipo_hidrocarburo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get aggregated data by department for map"""
    query = db.query(models.Royalty)
    
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
        
    from sqlalchemy import func
    
    results = query.with_entities(
        models.Royalty.departamento,
        func.sum(models.Royalty.valor_liquidado).label('total')
    ).group_by(models.Royalty.departamento).all()
    
    return [
        {
            "department": r.departamento,
            "value": r.total
        }
        for r in results
    ]

@router.get("/royalties/distribution")
def get_royalties_distribution(
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    tipo_hidrocarburo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get distribution by hydrocarbon type"""
    query = db.query(models.Royalty)
    
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
        
    from sqlalchemy import func
    
    results = query.with_entities(
        models.Royalty.tipo_hidrocarburo,
        func.sum(models.Royalty.valor_liquidado).label('total')
    ).group_by(models.Royalty.tipo_hidrocarburo).all()
    
    return [
        {
            "name": r.tipo_hidrocarburo,
            "value": r.total
        }
        for r in results
    ]

@router.get("/royalties/ranking")
def get_royalties_ranking(
    limit: int = 20,
    departamento: Optional[str] = None,
    campo: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    tipo_hidrocarburo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get top fields by royalties"""
    query = db.query(models.Royalty)
    
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
        
    from sqlalchemy import func, desc
    
    results = query.with_entities(
        models.Royalty.campo,
        func.sum(models.Royalty.valor_liquidado).label('total'),
        # We might need to aggregate types too, but for now let's simplify
        # If we need types per field, we'd need a more complex query or just return the dominant one
    ).group_by(models.Royalty.campo).order_by(desc('total')).limit(limit).all()
    
    return [
        {
            "name": r.campo,
            "value": r.total,
            # For the icon logic (Gas/Oil), we might need to fetch it separately or include it in group_by
            # For now, we'll send just the name and value. Frontend might lose the icon if we don't send type.
        }
        for r in results
    ]

# --- Streaming Export Endpoint ---

from fastapi.responses import StreamingResponse
import io
import csv

@router.get("/export/combined")
def export_combined_data(
    produccion: bool = False,
    demanda: bool = False,
    regalias: bool = False,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    format: str = 'csv', # csv or excel (tab-separated)
    db: Session = Depends(get_db)
):
    """
    Stream combined data export to avoid high RAM usage.
    Iterates through selected datasets and yields CSV rows.
    """
    
    delimiter = ',' if format == 'csv' else '\t'
    
    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output, delimiter=delimiter)
        
        # Write Header
        writer.writerow(['ID', 'Tipo', 'Periodo', 'Entidad Territorial', 'Concepto', 'Valor', 'Unidad', 'Fuente', 'Validado'])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        # 1. Production Data
        if produccion:
            query = db.query(models.Production)
            if fecha_inicio:
                query = query.filter(models.Production.fecha_periodo >= fecha_inicio)
            if fecha_fin:
                query = query.filter(models.Production.fecha_periodo <= fecha_fin)
                
            # Use yield_per to fetch in chunks and avoid loading all into memory
            for row in query.yield_per(1000):
                writer.writerow([
                    row.id,
                    'Producción',
                    row.fecha_periodo,
                    row.entidad_territorial,
                    row.campo,
                    row.valor,
                    row.unidad_medida,
                    'ANH', # Fuente defaults to ANH
                    'Sí'
                ])
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

        # 2. Demand Data
        if demanda:
            query = db.query(models.Demand)
            if fecha_inicio:
                query = query.filter(models.Demand.fecha_periodo >= fecha_inicio)
            if fecha_fin:
                query = query.filter(models.Demand.fecha_periodo <= fecha_fin)
                
            for row in query.yield_per(1000):
                writer.writerow([
                    row.id,
                    'Demanda',
                    row.fecha_periodo,
                    row.entidad_territorial,
                    row.region, # Concepto maps to Region for Demand
                    row.valor_real, # Use valor_real
                    row.unidad_medida,
                    'XM', # Fuente defaults to XM
                    'Sí'
                ])
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

        # 3. Royalties Data
        if regalias:
            query = db.query(models.Royalty)
            # Royalties usually have anio/mes, but we need to check if they have fecha_periodo column populated
            # Based on models.py (viewed earlier), Royalty has fecha_periodo
            if fecha_inicio:
                query = query.filter(models.Royalty.fecha_periodo >= fecha_inicio)
            if fecha_fin:
                query = query.filter(models.Royalty.fecha_periodo <= fecha_fin)
                
            for row in query.yield_per(1000):
                writer.writerow([
                    row.id,
                    'Regalías',
                    row.fecha_periodo,
                    row.entidad_territorial,
                    row.campo,
                    row.valor,
                    row.unidad_medida,
                    'ANM', # Fuente defaults to ANM
                    'Sí'
                ])
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

    filename = f"SIMGN_Informe.{'csv' if format == 'csv' else 'xls'}"
    media_type = "text/csv" if format == 'csv' else "application/vnd.ms-excel"
    
    return StreamingResponse(
        iter_csv(),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
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

# --- Demand Aggregation Endpoints ---

@router.get("/demand/kpis")
def get_demand_kpis(db: Session = Depends(get_db)):
    """
    Get aggregated KPIs for Demand: Total Real, Total Projected, Deviation.
    Real < 2024, Projected >= 2024.
    """
    # Total Real (anio < 2024)
    total_real = db.query(func.sum(models.Demand.demanda)).filter(models.Demand.anio < 2024).scalar() or 0
    
    # Total Projected (anio >= 2024)
    total_projected = db.query(func.sum(models.Demand.demanda)).filter(models.Demand.anio >= 2024).scalar() or 0
    
    # Deviation
    deviation = 0
    if total_projected > 0:
        deviation = ((total_real - total_projected) / total_projected) * 100
        
    return {
        "totalReal": total_real,
        "totalProjected": total_projected,
        "deviation": deviation
    }

@router.get("/demand/trend")
def get_demand_trend(db: Session = Depends(get_db)):
    """
    Get demand trend (Time Series).
    Returns list of { name: 'YYYY-MM', real: float|None, projected: float|None }
    """
    results = db.query(
        models.Demand.anio,
        models.Demand.mes,
        func.sum(models.Demand.demanda).label("total")
    ).group_by(models.Demand.anio, models.Demand.mes).all()
    
    data = []
    for r in results:
        periodo = f"{r.anio}-{str(r.mes).zfill(2)}"
        is_projected = r.anio >= 2024
        data.append({
            "name": periodo,
            "real": 0 if is_projected else r.total,
            "projected": r.total if is_projected else 0
        })
    
    # Sort by date
    data.sort(key=lambda x: x["name"])
    return data

@router.get("/demand/sector")
def get_demand_by_sector(db: Session = Depends(get_db)):
    """
    Get demand distribution by sector.
    """
    results = db.query(
        models.Demand.sector,
        func.sum(models.Demand.demanda).label("total")
    ).group_by(models.Demand.sector).all()
    
    return [
        {"name": r.sector or "Desconocido", "value": r.total}
        for r in results
        if r.total > 0
    ]

@router.get("/demand/scenarios")
def get_demand_scenarios(db: Session = Depends(get_db)):
    """Get demand scenarios (Real vs Projected)"""
    # Filter for 'Agregado' sector to get totals
    query = db.query(
        models.Demand.anio,
        models.Demand.escenario,
        func.sum(models.Demand.demanda).label('total')
    ).filter(
        models.Demand.sector == 'Agregado',
        models.Demand.region == 'Nacional'
    ).group_by(models.Demand.anio, models.Demand.escenario)
    
    results = query.all()
    
    # Pivot data: { year: 2024, Bajo: 100, Medio: 120, ... }
    data_by_year = {}
    for row in results:
        year = row.anio
        if year not in data_by_year:
            data_by_year[year] = {"year": year}
        data_by_year[year][row.escenario] = row.total
        
    return sorted(list(data_by_year.values()), key=lambda x: x['year'])

@router.get("/demand/sectors")
def get_demand_sectors(db: Session = Depends(get_db)):
    """Get demand by sector (Stacked Area Chart)"""
    # Filter for 'Medio' scenario and exclude 'Agregado'
    query = db.query(
        models.Demand.anio,
        models.Demand.sector,
        func.sum(models.Demand.demanda).label('total')
    ).filter(
        models.Demand.escenario == 'Medio',
        models.Demand.sector != 'Agregado'
    ).group_by(models.Demand.anio, models.Demand.sector)
    
    results = query.all()
    
    data_by_year = {}
    for row in results:
        year = row.anio
        if year not in data_by_year:
            data_by_year[year] = {"year": year}
        data_by_year[year][row.sector] = row.total
        
    return sorted(list(data_by_year.values()), key=lambda x: x['year'])

@router.get("/demand/map")
def get_demand_map(db: Session = Depends(get_db)):
    """Get demand by region for map (Heatmap)"""
    # Filter for 'Medio' scenario and exclude 'Nacional'
    # Get average annual demand for the projection period (e.g., > 2023)
    query = db.query(
        models.Demand.region,
        func.avg(models.Demand.demanda).label('avg_demand')
    ).filter(
        models.Demand.escenario == 'Medio',
        models.Demand.region != 'Nacional',
        models.Demand.anio >= 2024
    ).group_by(models.Demand.region)
    
    results = query.all()
    return [{"region": row.region, "value": row.avg_demand} for row in results]

@router.get("/demand/balance")
def get_demand_balance(db: Session = Depends(get_db)):
    """Get Supply (Production) vs Demand (High Scenario) Balance"""
    # 1. Get Demand (High Scenario)
    demand_query = db.query(
        models.Demand.anio,
        func.sum(models.Demand.demanda).label('demand')
    ).filter(
        models.Demand.escenario == 'Alto',
        models.Demand.sector == 'Agregado',
        models.Demand.anio >= 2024
    ).group_by(models.Demand.anio).all()
    
    demand_dict = {row.anio: row.demand for row in demand_query}
    
    # 2. Get Production (Projected) - Assuming simple projection or using existing data
    # For now, let's use the max year of production and project flat, OR use existing production data if available for future
    # Real production usually stops at current year. We might need a 'Potential Production' model or just use current production as baseline.
    # For this exercise, let's sum production by year.
    prod_query = db.query(
        models.Production.anio,
        func.sum(models.Production.produccion_mensual).label('production')
    ).group_by(models.Production.anio).all()
    
    prod_dict = {row.anio: row.production for row in prod_query}
    
    # Combine
    years = sorted(list(set(demand_dict.keys()) | set(prod_dict.keys())))
    result = []
    
    # Simple heuristic for future production: use last known year's production
    last_prod_year = max(prod_dict.keys()) if prod_dict else 0
    last_prod_val = prod_dict.get(last_prod_year, 0)
    
    for year in years:
        if year < 2024: continue # Focus on future balance
        
        d_val = demand_dict.get(year, 0)
        # Use actual production if available, else flat projection of last known
        p_val = prod_dict.get(year, last_prod_val) 
        
        # Convert Production to GBTUD if needed. 
        # Production is usually in KPC (thousands of cubic feet). 
        # 1 GBTU = 1 KPC (approx, varies by heating value).
        # So KPC/month / 30 = KPC/day = GBTUD (approx).
        
        p_val_gbtud = (p_val / 365) if p_val > 0 else 0 # Annual KPC -> Daily KPC (GBTUD)
        
        result.append({
            "year": year,
            "demand": d_val,
            "production": p_val_gbtud,
            "deficit": d_val - p_val_gbtud if d_val > p_val_gbtud else 0
        })
        
    return result

@router.get("/demand/region")
def get_demand_by_region(db: Session = Depends(get_db)):
    """
    Get demand distribution by region.
    """
    results = db.query(
        models.Demand.region,
        func.sum(models.Demand.demanda).label("total")
    ).group_by(models.Demand.region).all()
    
    return [
        {"name": r.region or "Desconocido", "value": r.total}
        for r in results
        if r.total > 0
    ]

@router.get("/demand/stats")
def get_demand_stats(db: Session = Depends(get_db)):
    total_demand = db.query(models.Demand).with_entities(models.Demand.demanda).all()
    total = sum([v[0] for v in total_demand if v[0]])
    count = db.query(models.Demand).count()
    return {"total_records": count, "total_demand_gbtud": total}

