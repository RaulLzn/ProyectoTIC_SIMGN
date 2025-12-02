from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db
import models
import schemas
from typing import List, Optional
from datetime import datetime

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
    
    # Normalization Mapping (DB -> Frontend)
    dept_mapping = {
        'ANTIOQUIA': 'Antioquia',
        'ARAUCA': 'Arauca',
        'ATLANTICO': 'Atlántico',
        'BOLIVAR': 'Bolívar',
        'BOYACA': 'Boyacá',
        'CALDAS': 'Caldas',
        'CAQUETA': 'Caquetá',
        'CASANARE': 'Casanare',
        'CAUCA': 'Cauca',
        'CESAR': 'Cesar',
        'CHOCO': 'Chocó',
        'CORDOBA': 'Córdoba',
        'CUNDINAMARCA': 'Cundinamarca',
        'GUAJIRA': 'La Guajira',
        'GUAVIARE': 'Guaviare',
        'HUILA': 'Huila',
        'MAGDALENA': 'Magdalena',
        'META': 'Meta',
        'NARIÑO': 'Nariño',
        'NORTE DE SANTANDER': 'Norte de Santander',
        'PUTUMAYO': 'Putumayo',
        'QUINDIO': 'Quindío',
        'RISARALDA': 'Risaralda',
        'SANTANDER': 'Santander',
        'SUCRE': 'Sucre',
        'TOLIMA': 'Tolima',
        'VALLE DEL CAUCA': 'Valle del Cauca',
        'VICHADA': 'Vichada',
        'AMAZONAS': 'Amazonas',
        'VAUPES': 'Vaupés',
        'GUAINIA': 'Guainía',
        'SAN ANDRES': 'San Andrés y Providencia'
    }

    normalized_results = []
    for r in results:
        dept_name = r.departamento
        # Try exact match, then upper match
        norm_name = dept_mapping.get(dept_name) or dept_mapping.get(dept_name.upper()) or dept_name.title()
        
        normalized_results.append({
            "department": norm_name,
            "value": r.total
        })
        
    return normalized_results

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
    ).group_by(models.Royalty.campo).order_by(desc('total')).limit(limit).all()
    
    return [
        {
            "name": r.campo,
            "value": r.total,
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
    
    # ... (CSV/Excel logic remains) ...
    
    if format == 'pdf':
        from reports import PDFReportGenerator
        
        # Gather Data for Report
        # 1. KPIs
        kpis = get_stats_kpis(db)
        
        # 2. Top Operators
        # Reusing logic from get_production_ranking
        top_ops_query = db.query(
            models.Production.operadora.label('name'),
            func.sum(models.Production.produccion_mensual).label('total')
        ).group_by(models.Production.operadora).order_by(desc('total')).limit(5).all()
        
        total_prod = db.query(func.sum(models.Production.produccion_mensual)).scalar() or 1
        top_operators = [{"name": r.name, "value": (r.total / total_prod) * 100} for r in top_ops_query]
        
        # 3. Regional Balance
        regional_balance = get_stats_regional_balance(db)
        
        report_data = {
            "kpis": kpis,
            "top_operators": top_operators,
            "regional_balance": regional_balance
        }
        
        pdf_buffer = PDFReportGenerator().generate(report_data)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=SIMGN_Informe_Ejecutivo_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )

    delimiter = ',' if format == 'csv' else '\t'
    
    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output, delimiter=delimiter)
        
        # Write Header
        writer.writerow(['ID', 'Tipo', 'Año', 'Mes', 'Entidad Territorial', 'Concepto', 'Valor', 'Unidad', 'Fuente', 'Validado'])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        # Helper to parse dates
        start_year, start_month = (None, None)
        end_year, end_month = (None, None)
        
        if fecha_inicio:
            try:
                dt = datetime.strptime(fecha_inicio, '%Y-%m-%d')
                start_year, start_month = dt.year, dt.month
            except: pass
            
        if fecha_fin:
            try:
                dt = datetime.strptime(fecha_fin, '%Y-%m-%d')
                end_year, end_month = dt.year, dt.month
            except: pass

        # 1. Production Data
        if produccion:
            query = db.query(models.Production)
            if start_year:
                query = query.filter(models.Production.anio >= start_year)
            if end_year:
                query = query.filter(models.Production.anio <= end_year)
                
            for row in query.yield_per(1000):
                writer.writerow([
                    row.id,
                    'Producción',
                    row.anio,
                    row.mes,
                    f"{row.departamento} - {row.municipio}",
                    row.campo,
                    row.produccion_mensual,
                    'KPC', # Assuming KPC based on models comment
                    'ANH',
                    'Sí'
                ])
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

        # 2. Demand Data
        if demanda:
            query = db.query(models.Demand)
            if start_year:
                query = query.filter(models.Demand.anio >= start_year)
            if end_year:
                query = query.filter(models.Demand.anio <= end_year)
                
            for row in query.yield_per(1000):
                writer.writerow([
                    row.id,
                    'Demanda',
                    row.anio,
                    row.mes,
                    row.region,
                    row.sector,
                    row.demanda,
                    'GBTUD',
                    'XM',
                    'Sí'
                ])
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

        # 3. Royalties Data
        if regalias:
            query = db.query(models.Royalty)
            if start_year:
                query = query.filter(models.Royalty.anio >= start_year)
            if end_year:
                query = query.filter(models.Royalty.anio <= end_year)
                
            for row in query.yield_per(1000):
                writer.writerow([
                    row.id,
                    'Regalías',
                    row.anio,
                    row.mes,
                    f"{row.departamento} - {row.municipio}",
                    row.campo,
                    row.valor_liquidado,
                    'COP',
                    'ANM',
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

@router.get("/demand/sectors")
def get_demand_sectors_trend(db: Session = Depends(get_db)):
    """
    Get demand trend by sector (Stacked Area Chart data).
    Returns: [{ "year": 2024, "Industrial": 120, "Residencial": 80, ... }, ...]
    """
    # Query sum of demand by Year and Sector (Scenario Medio)
    results = db.query(
        models.Demand.anio,
        models.Demand.sector,
        func.sum(models.Demand.demanda).label("total")
    ).filter(
        models.Demand.escenario == 'Medio',
        models.Demand.sector != 'Agregado' # Exclude aggregate if present
    ).group_by(models.Demand.anio, models.Demand.sector).all()
    
    # Pivot Data
    data_by_year = {}
    for r in results:
        if r.anio not in data_by_year:
            data_by_year[r.anio] = {"year": r.anio}
        data_by_year[r.anio][r.sector] = r.total
        
    # Convert to list and sort
    final_data = sorted(list(data_by_year.values()), key=lambda x: x["year"])
    
    return final_data

@router.get("/demand/scenarios")
def get_demand_scenarios(db: Session = Depends(get_db)):
    """
    Get demand scenarios (Real vs Projected) pivoted for Recharts.
    Returns: [{ "year": 2024, "Bajo": 100, "Medio": 120, "Alto": 140 }, ...]
    """
    # Filter for 'Agregado' sector to get totals
    results = db.query(
        models.Demand.anio,
        models.Demand.escenario,
        func.sum(models.Demand.demanda).label("total")
    ).filter(models.Demand.sector == 'Agregado').group_by(models.Demand.anio, models.Demand.escenario).all()
    
    # Pivot Data
    data_by_year = {}
    for r in results:
        if r.anio not in data_by_year:
            data_by_year[r.anio] = {"year": r.anio}
        
        # Map scenario name to key (handle potential casing issues if needed)
        scenario_key = r.escenario
        data_by_year[r.anio][scenario_key] = r.total
        
    # Convert to list and sort
    final_data = sorted(list(data_by_year.values()), key=lambda x: x["year"])
    
    return final_data

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
        models.Demand.region == 'Nacional', # Ensure we don't double count
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

# --- Statistics / Strategic Dashboard Endpoints ---

@router.get("/stats/kpis")
def get_stats_kpis(db: Session = Depends(get_db)):
    """Get Global KPIs for the Dashboard"""
    current_year = 2023 # Or dynamic
    
    # 1. Total Production (Annual)
    prod_total = db.query(func.sum(models.Production.produccion_mensual)).filter(models.Production.anio == current_year).scalar() or 0
    prod_avg_gbtud = (prod_total / 365) # KPC/year -> GBTUD (approx)
    
    # 2. Total Royalties (Annual & Historical)
    royalty_annual = db.query(func.sum(models.Royalty.valor_liquidado)).filter(models.Royalty.anio == current_year).scalar() or 0
    royalty_total_historical = db.query(func.sum(models.Royalty.valor_liquidado)).scalar() or 0
    
    # 3. Total Demand (Annual - Real or Projected)
    demand_total = db.query(func.sum(models.Demand.demanda)).filter(
        models.Demand.anio == current_year,
        models.Demand.escenario == 'Medio', # Use Medio as baseline
        models.Demand.sector == 'Agregado',
        models.Demand.region == 'Nacional'
    ).scalar() or 0
    
    # 4. Coverage Ratio
    coverage = (prod_avg_gbtud / demand_total * 100) if demand_total > 0 else 0
    
    return {
        "year": current_year,
        "production_avg_gbtud": prod_avg_gbtud,
        "royalties_annual_cop": royalty_annual,
        "royalties_total_historical_cop": royalty_total_historical,
        "demand_avg_gbtud": demand_total, 
        "coverage_ratio": coverage
    }

@router.get("/stats/production-vs-royalties")
def get_stats_prod_vs_royalties(db: Session = Depends(get_db)):
    """Get Time Series for Production Volume vs Royalties Value"""
    # Production by Year
    prod_query = db.query(
        models.Production.anio,
        func.sum(models.Production.produccion_mensual).label('volume')
    ).group_by(models.Production.anio).all()
    
    prod_map = {r.anio: r.volume for r in prod_query}
    
    # Royalties by Year
    roy_query = db.query(
        models.Royalty.anio,
        func.sum(models.Royalty.valor_liquidado).label('value')
    ).group_by(models.Royalty.anio).all()
    
    roy_map = {r.anio: r.value for r in roy_query}
    
    years = sorted(list(set(prod_map.keys()) | set(roy_map.keys())))
    
    result = []
    for y in years:
        p_vol = prod_map.get(y, 0)
        r_val = roy_map.get(y, 0)
        
        # Only include years where we have BOTH data points (Intersection)
        # This avoids showing drops to zero for future projections or missing historical data
        if p_vol > 0 and r_val > 0:
            result.append({
                "year": y,
                "production_vol": p_vol,
                "royalties_val": r_val
            })
            
    return result

@router.get("/stats/regional-balance")
def get_stats_regional_balance(db: Session = Depends(get_db)):
    """Get Supply vs Demand by Department"""
    # 1. Production by Department (Supply)
    prod_query = db.query(
        models.Production.departamento,
        func.sum(models.Production.produccion_mensual).label('volume')
    ).filter(models.Production.anio == 2023).group_by(models.Production.departamento).all()
    
    supply_map = {r.departamento: (r.volume / 365) for r in prod_query} # GBTUD
    
    # 2. Demand by Region (Demand) -> Map to Departments
    demand_query = db.query(
        models.Demand.region,
        func.sum(models.Demand.demanda).label('demand')
    ).filter(
        models.Demand.anio == 2023,
        models.Demand.escenario == 'Medio',
        models.Demand.sector == 'Agregado'
    ).group_by(models.Demand.region).all()
    
    # Mapping Logic (UPME Region -> Departments)
    mapping = {
        'Costa Atlántica': ['Atlántico', 'La Guajira', 'Magdalena'],
        'Costa Interior': ['Bolívar', 'Cesar', 'Córdoba', 'Sucre'],
        'Centro': ['Bogotá D.C.', 'Cundinamarca', 'Boyacá', 'Meta'],
        'NorOccidente': ['Antioquia', 'Chocó'],
        'SurOccidente': ['Valle del Cauca', 'Cauca', 'Nariño'],
        'NorOriente': ['Santander', 'Norte de Santander', 'Arauca'],
        'Tolima-Huila': ['Tolima', 'Huila'],
        'CQR': ['Casanare'],
        'Magdalena Medio': ['Santander'],
    }
    
    dept_demand = {}
    
    for r in demand_query:
        region = r.region
        val = r.demand
        depts = mapping.get(region, [])
        if not depts: continue
        
        val_per_dept = val / len(depts)
        for d in depts:
            dept_demand[d] = dept_demand.get(d, 0) + val_per_dept
            
    # Combine
    all_depts = set(supply_map.keys()) | set(dept_demand.keys())
    result = []
    
    for d in all_depts:
        s = supply_map.get(d, 0)
        dem = dept_demand.get(d, 0)
        balance = s - dem
        result.append({
            "department": d,
            "supply": s,
            "demand": dem,
            "balance": balance,
            "status": "Superávit" if balance > 0 else "Déficit"
        })
        
    return sorted(result, key=lambda x: x['balance'], reverse=True)

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

@router.get("/demand/map")
def get_demand_map(db: Session = Depends(get_db)):
    """
    Get demand distribution mapped to departments for the map visualization.
    """
    # Query demand by region
    results = db.query(
        models.Demand.region,
        func.sum(models.Demand.demanda).label("total")
    ).group_by(models.Demand.region).all()
    
    # Mapping from UPME Regions to Departments
    mapping = {
        'Costa Atlántica': ['Atlántico', 'La Guajira', 'Magdalena'],
        'Costa Interior': ['Bolívar', 'Cesar', 'Córdoba', 'Sucre'],
        'Centro': ['Bogotá D.C.', 'Cundinamarca', 'Boyacá', 'Meta'],
        'NorOccidente': ['Antioquia', 'Chocó'],
        'SurOccidente': ['Valle del Cauca', 'Cauca', 'Nariño'],
        'NorOriente': ['Santander', 'Norte de Santander', 'Arauca'],
        'Tolima-Huila': ['Tolima', 'Huila'],
        'CQR': ['Casanare'],
        'Magdalena Medio': ['Santander'],
    }
    
    dept_demand = {}
    
    for r in results:
        region = r.region
        val = r.total
        if not val or val <= 0: continue
        
        depts = mapping.get(region, [])
        if not depts: continue
        
        # Distribute regional demand evenly among departments in that region
        val_per_dept = val / len(depts)
        for d in depts:
            dept_demand[d] = dept_demand.get(d, 0) + val_per_dept
            
    return [
        {"name": k, "value": v}
        for k, v in dept_demand.items()
    ]

@router.get("/demand/stats")
def get_demand_stats(db: Session = Depends(get_db)):
    total_demand = db.query(models.Demand).with_entities(models.Demand.demanda).all()
    total = sum([v[0] for v in total_demand if v[0]])
    count = db.query(models.Demand).count()
    return {"total_records": count, "total_demand_gbtud": total}
