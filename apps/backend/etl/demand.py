import pandas as pd
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from models import Demand
from database import SessionLocal
import datetime
import io
import zipfile
import re

UPME_URL = "https://www1.upme.gov.co/DemandayEficiencia/Paginas/Proyeccion_Demanda_Gas_Natural.aspx"
FALLBACK_URL = "https://docs.upme.gov.co/DemandayEficiencia/Documents/Anexo_Datos_Proyeccion_Demanda_Gas_Nat_2024.zip"

def get_demand_file_url():
    print("🔍 Buscando URL de archivo de Demanda en UPME...")
    try:
        try:
            response = requests.get(UPME_URL, timeout=15, verify=False)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                links = soup.find_all('a', href=True)
                for link in links:
                    href = link['href']
                    if 'anexo' in href.lower() and 'zip' in href.lower() and 'gas' in href.lower():
                        full_url = href if href.startswith('http') else f"https://www1.upme.gov.co{href}"
                        print(f"   ✅ URL encontrada: {full_url}")
                        return full_url
        except Exception as e:
            print(f"   ⚠️ Error en scraping: {e}")
        print(f"   ⚠️ Usando URL de respaldo: {FALLBACK_URL}")
        return FALLBACK_URL
    except Exception as e:
        print(f"   ❌ Error general buscando URL: {e}")
        return None

def process_sheet(df, sheet_type, file_sector="Agregado"):
    """
    Transforma un DataFrame de una hoja específica al formato del modelo Demand.
    """
    data = []
    try:
        # Limpieza básica
        df.columns = [str(c).strip() for c in df.columns]
        
        # Identificar columna de fecha (usualmente la primera o segunda)
        # En 'Esc Alto, Medio y Bajo', la fecha suele estar en la columna 1 (índice) si hay encabezados complejos
        # Pero pandas read_excel con header=3 suele dejar la fecha en la primera columna
        
        # Buscar columna de fecha
        date_col = None
        for col in df.columns:
            if 'fecha' in col.lower() or 'año' in col.lower() or 'mes' in col.lower() or isinstance(df[col].iloc[0], (datetime.datetime, pd.Timestamp)):
                date_col = col
                break
        
        if not date_col:
            # Asumir primera columna si no se encuentra
            date_col = df.columns[0]

        # Renombrar para estandarizar
        df.rename(columns={date_col: 'Fecha'}, inplace=True)
        
        # Filtrar filas sin fecha válida
        df = df[pd.to_datetime(df['Fecha'], errors='coerce').notna()]
        
        # Melt (Unpivot)
        id_vars = ['Fecha']
        value_vars = [c for c in df.columns if c not in id_vars and 'Unnamed' not in c]
        
        melted = df.melt(id_vars=id_vars, value_vars=value_vars, var_name='Variable', value_name='Valor')
        
        for _, row in melted.iterrows():
            try:
                fecha = pd.to_datetime(row['Fecha'])
                valor = float(row['Valor'])
                variable = str(row['Variable'])
                
                if pd.isna(valor):
                    continue

                item = Demand(
                    anio=fecha.year,
                    mes=fecha.month,
                    fecha_carga=datetime.datetime.now(datetime.timezone.utc),
                    demanda=valor
                )

                # Lógica específica por tipo de hoja
                if sheet_type == 'SCENARIOS':
                    item.region = "Nacional"
                    item.sector = file_sector
                    if 'bajo' in variable.lower(): item.escenario = 'Bajo'
                    elif 'alto' in variable.lower(): item.escenario = 'Alto'
                    elif 'medio' in variable.lower(): item.escenario = 'Medio'
                    elif 'hist' in variable.lower(): item.escenario = 'Histórico'
                    else: item.escenario = variable # Fallback

                elif sheet_type == 'REGIONAL':
                    # Skip 'Nacional' in Regional sheet to avoid duplication with SCENARIOS sheet
                    if variable.lower() == 'nacional':
                        continue
                    item.escenario = 'Medio'
                    item.sector = 'Agregado' # Asumimos que la hoja regional es demanda agregada
                    item.region = variable

                elif sheet_type == 'SECTORIAL':
                    # Variable es el Sector
                    item.region = "Nacional"
                    item.sector = variable
                    item.escenario = 'Medio' # Asumimos Medio para desglose sectorial

                data.append(item)
            except Exception as e:
                continue
                
    except Exception as e:
        print(f"     ❌ Error transformando hoja {sheet_type}: {e}")
        
    return data

def extract_demand():
    url = get_demand_file_url()
    if not url: return []
    
    print(f"📥 Descargando datos de Demanda desde {url}...")
    all_data = []
    
    try:
        response = requests.get(url, timeout=60, verify=False)
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            excel_files = [f for f in z.namelist() if (f.endswith('.xlsx') or f.endswith('.xls'))]
            
            # Priorizar archivo Agregada
            agregada_file = next((f for f in excel_files if 'agregada' in f.lower()), None)
            
            files_to_process = [agregada_file] if agregada_file else excel_files
            
            for file_name in files_to_process:
                if not file_name: continue
                
                print(f"   📄 Procesando archivo principal: {file_name}")
                with z.open(file_name) as f:
                    xl = pd.ExcelFile(f)
                    
                    # 1. Procesar Escenarios (Alto, Medio, Bajo)
                    sheet_scenarios = next((s for s in xl.sheet_names if 'alto' in s.lower() and 'bajo' in s.lower()), None)
                    if sheet_scenarios:
                        print(f"     - Procesando Escenarios: {sheet_scenarios}")
                        # Header en fila 1 (0-indexed) contiene los nombres de escenarios
                        df = pd.read_excel(f, sheet_name=sheet_scenarios, header=1)
                        all_data.extend(process_sheet(df, 'SCENARIOS'))

                    # 2. Procesar Regional (Esc Med Regional)
                    sheet_regional = next((s for s in xl.sheet_names if 'regional' in s.lower()), None)
                    if sheet_regional:
                        print(f"     - Procesando Regional: {sheet_regional}")
                        df = pd.read_excel(f, sheet_name=sheet_regional, header=3)
                        all_data.extend(process_sheet(df, 'REGIONAL'))

                    # 3. Procesar Sectorial (Esc Med Sectorial)
                    sheet_sectorial = next((s for s in xl.sheet_names if 'sectorial' in s.lower()), None)
                    if sheet_sectorial:
                        print(f"     - Procesando Sectorial: {sheet_sectorial}")
                        df = pd.read_excel(f, sheet_name=sheet_sectorial, header=3)
                        all_data.extend(process_sheet(df, 'SECTORIAL'))
                        
    except Exception as e:
        print(f"   ❌ Error extrayendo demanda: {e}")
        
    return all_data

def load_demand(data: list, db: Session):
    print(f"💾 Cargando {len(data):,} registros de Demanda...")
    try:
        deleted = db.query(Demand).delete()
        print(f"   🗑️  Eliminados {deleted} registros antiguos")
        
        batch_size = 5000
        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            db.add_all(batch)
            db.commit()
            print(f"   ... lote {i//batch_size + 1} cargado")
            
        print("   ✅ Carga completada exitosamente")
    except Exception as e:
        print(f"   ❌ Error cargando demanda: {e}")
        db.rollback()

def run_demand_etl():
    print("\n" + "="*70)
    print("  🚀 ETL DE DEMANDA (REDEFINIDO)")
    print("="*70)
    
    # Ensure tables exist
    from database import engine, Base
    Base.metadata.create_all(bind=engine)
    
    data = extract_demand()
    if data:
        db = SessionLocal()
        load_demand(data, db)
        db.close()
    else:
        print("   ⚠️ No hay datos para cargar.")
    
    print("="*70 + "\n")

if __name__ == "__main__":
    run_demand_etl()
