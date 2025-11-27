from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from database import Base
import datetime

class Royalty(Base):
    __tablename__ = "royalties"

    id = Column(Integer, primary_key=True, index=True)
    departamento = Column(String, index=True)
    municipio = Column(String, index=True)
    campo = Column(String, index=True)
    contrato = Column(String)
    anio = Column(Integer) # Replaces periodo
    mes = Column(Integer)
    
    # New columns
    volumen_regalia = Column(Float) # VolumenRegaliaBlsKpc
    trm_promedio = Column(Float)
    tipo_prod = Column(String)
    tipo_hidrocarburo = Column(String)
    regimen = Column(String) # RegimenReg
    prod_gravable = Column(Float) # ProdGravableBlsKpc
    precio_usd = Column(Float) # PrecioHidrocarburoUSD
    porc_regalia = Column(Float)
    
    longitud = Column(Float)
    latitud = Column(Float)
    
    valor_liquidado = Column(Float) # RegaliasCOP
    fecha_carga = Column(DateTime, default=datetime.datetime.utcnow)

class Production(Base):
    __tablename__ = "production"

    id = Column(Integer, primary_key=True, index=True)
    campo = Column(String, index=True)
    operadora = Column(String, index=True)
    departamento = Column(String)
    municipio = Column(String)
    anio = Column(Integer)
    mes = Column(Integer)
    produccion_mensual = Column(Float) # en KPC o similar
    fecha_carga = Column(DateTime, default=datetime.datetime.utcnow)

class Demand(Base):
    __tablename__ = "demand"

    id = Column(Integer, primary_key=True, index=True)
    sector = Column(String, index=True) # Residencial, Industrial, etc.
    region = Column(String, index=True)
    anio = Column(Integer)
    mes = Column(Integer)
    escenario = Column(String) # Alto, Medio, Bajo
    demanda = Column(Float) # en GBTUD
    fecha_carga = Column(DateTime, default=datetime.datetime.utcnow)
