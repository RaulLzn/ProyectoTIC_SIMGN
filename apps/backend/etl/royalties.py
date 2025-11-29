import pandas as pd
import requests
from sqlalchemy.orm import Session
from models import Royalty
from database import SessionLocal
import datetime

SOCRATA_URL = "https://www.datos.gov.co/resource/j7js-yk74.json"

def extract_royalties():
    """
    Extrae TODOS los registros de regalías usando paginación.
    """
    print("🔍 Iniciando extracción completa de Regalías...")
    all_data = []
    limit = 5000
    offset = 0
    
    try:
        while True:
            print(f"   📥 Descargando lote: offset={offset}, limit={limit}...")
            url = f"{SOCRATA_URL}?$limit={limit}&$offset={offset}"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if not data:
                break
                
            all_data.extend(data)
            print(f"   ✅ Lote recibido: {len(data)} registros. Total acumulado: {len(all_data)}")
            
            if len(data) < limit:
                break
                
            offset += limit
            
        df = pd.DataFrame(all_data)
        print(f"   🎉 Extracción finalizada. Total registros: {len(df)}")
        if not df.empty:
             print("DEBUG - Columnas encontradas:", df.columns.tolist())
        return df

    except Exception as e:
        print(f"   ❌ Error extrayendo regalías: {e}")
        return pd.DataFrame(all_data) if all_data else pd.DataFrame()

def transform_royalties(df: pd.DataFrame):
    print("Transforming Royalties data...")
    if df.empty:
        return []
    
    transformed_data = []
    for _, row in df.iterrows():
        try:
            # Map fields based on Socrata column names (usually lowercase)
            # Adjust column names based on actual API response if needed
            item = Royalty(
                departamento=row.get("departamento"),
                municipio=row.get("municipio"),
                campo=row.get("campo"),
                contrato=row.get("contrato"),
                anio=int(row.get("a_o")) if row.get("a_o") else None,
                mes=int(row.get("mes")) if row.get("mes") else None,
                
                volumen_regalia=float(str(row.get("volumenregaliablskpc", 0)).replace(',', '.')),
                trm_promedio=float(str(row.get("trmpromedio", 0)).replace(',', '.')),
                tipo_prod=row.get("tipoprod"),
                tipo_hidrocarburo=row.get("tipohidrocarburo"),
                regimen=row.get("regimenreg"),
                prod_gravable=float(str(row.get("prodgravableblskpc", 0)).replace(',', '.')),
                precio_usd=float(str(row.get("preciohidrocarburousd", 0)).replace(',', '.')),
                porc_regalia=float(str(row.get("porcregalia", 0)).replace(',', '.')),
                
                longitud=float(str(row.get("longitud", 0)).replace(',', '.')) if row.get("longitud") else None,
                latitud=float(str(row.get("latitud", 0)).replace(',', '.')) if row.get("latitud") else None,
                
                valor_liquidado=float(str(row.get("regaliascop", 0)).replace(',', '.')),
                fecha_carga=datetime.datetime.utcnow()
            )
            transformed_data.append(item)
        except Exception as e:
            print(f"Error transforming row: {e}")
            continue
    return transformed_data

def load_royalties(data: list, db: Session):
    print(f"Loading {len(data)} Royalties records...")
    try:
        # Optional: Clear existing data or handle duplicates
        db.query(Royalty).delete()
        
        db.add_all(data)
        db.commit()
        print("Royalties loaded successfully.")
    except Exception as e:
        print(f"Error loading royalties: {e}")
        db.rollback()

def run_royalties_etl():
    df = extract_royalties()
    if not df.empty:
        data = transform_royalties(df)
        db = SessionLocal()
        load_royalties(data, db)
        db.close()

if __name__ == "__main__":
    run_royalties_etl()
