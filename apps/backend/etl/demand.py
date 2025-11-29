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
# Fallback URL if scraping fails
FALLBACK_URL = "https://docs.upme.gov.co/DemandayEficiencia/Documents/Anexo_Datos_Proyeccion_Demanda_Gas_Nat_2024.zip"

def get_demand_file_url():
    """
    Busca la URL del archivo ZIP de proyección de demanda en la página de la UPME.
    """
    print("🔍 Buscando URL de archivo de Demanda en UPME...")
    try:
        # Intentar scraping primero
        try:
            response = requests.get(UPME_URL, timeout=15, verify=False) # UPME a veces tiene problemas de SSL
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                links = soup.find_all('a', href=True)
                
                for link in links:
                    href = link['href']
                    text = link.get_text().lower()
                    
                    if 'anexo' in href.lower() and 'zip' in href.lower() and 'gas' in href.lower():
                        full_url = href if href.startswith('http') else f"https://www1.upme.gov.co{href}"
                        print(f"   ✅ URL encontrada: {full_url}")
                        return full_url
        except Exception as e:
            print(f"   ⚠️ Error en scraping: {e}")

        # Si falla, usar fallback conocido
        print(f"   ⚠️ Usando URL de respaldo: {FALLBACK_URL}")
        return FALLBACK_URL

    except Exception as e:
        print(f"   ❌ Error general buscando URL: {e}")
        return None

def extract_demand():
    """
    Descarga el ZIP y extrae TODOS los archivos Excel de proyección de demanda.
    """
    url = get_demand_file_url()
    if not url:
        return pd.DataFrame()
    
    print(f"📥 Descargando datos de Demanda desde {url}...")
    try:
        response = requests.get(url, timeout=60, verify=False)
        response.raise_for_status()
        
        all_dfs = []
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            print(f"   📦 Contenido del ZIP: {len(z.namelist())} archivos")
            
            # Buscar archivos Excel relevantes
            excel_files = [f for f in z.namelist() if (f.endswith('.xlsx') or f.endswith('.xls')) and 'proyecc' in f.lower()]
            
            print(f"   📋 Encontrados {len(excel_files)} archivos de proyección")
            
            for file_name in excel_files:
                try:
                    # Determinar sector basado en nombre de archivo
                    sector = "Desconocido"
                    name_lower = file_name.lower()
                    
                    if "agregada" in name_lower:
                        sector = "Agregada"
                    elif "industrial" in name_lower:
                        sector = "Industrial"
                    elif "residencial" in name_lower:
                        sector = "Residencial"
                    elif "terciario" in name_lower: # Comercial/Terciario
                        sector = "Comercial"
                    elif "gnc" in name_lower or "comprimido" in name_lower:
                        sector = "GNC Transporte"
                    elif "gnl" in name_lower:
                        sector = "GNL Transporte"
                    elif "petroqu" in name_lower:
                        sector = "Petroquímica"
                    elif "petrolero" in name_lower:
                        sector = "Petrolero"
                    elif "termo" in name_lower:
                        sector = "Termoeléctrico"
                    elif "compresores" in name_lower:
                        sector = "Compresores"
                    
                    print(f"     📄 Procesando: {file_name} (Sector: {sector})")
                    
                    with z.open(file_name) as f:
                        # Leer la hoja 'Esc Med Regional'
                        try:
                            df = pd.read_excel(f, sheet_name='Esc Med Regional', header=3)
                        except ValueError:
                            # Intentar primera hoja si falla
                            f.seek(0)
                            df = pd.read_excel(f, header=3)
                        
                        # Añadir columna de sector
                        df['Sector_Origen'] = sector
                        all_dfs.append(df)
                        
                except Exception as e:
                    print(f"     ❌ Error procesando {file_name}: {e}")
                    continue

        if all_dfs:
            combined_df = pd.concat(all_dfs, ignore_index=True)
            print(f"   ✅ Total extraído: {len(combined_df):,} filas de {len(all_dfs)} archivos")
            return combined_df
        else:
            print("   ❌ No se pudieron extraer datos de ningún archivo.")
            return pd.DataFrame()

    except Exception as e:
        print(f"   ❌ Error extrayendo demanda: {e}")
        return pd.DataFrame()

def transform_demand(df: pd.DataFrame):
    """
    Transforma los datos de demanda (formato ancho a largo).
    """
    print(f"🔄 Transformando {len(df)} filas de datos crudos...")
    if df.empty:
        return []
    
    transformed_data = []
    
    try:
        # Limpiar columnas
        # La primera columna debería ser la fecha
        date_col = df.columns[0]
        df.rename(columns={date_col: 'Fecha'}, inplace=True)
        
        # Eliminar filas sin fecha válida
        df = df.dropna(subset=['Fecha'])
        df = df[pd.to_datetime(df['Fecha'], errors='coerce').notna()]
        
        # Convertir formato ancho a largo (Unpivot)
        # Las columnas restantes deberían ser regiones (excluyendo Fecha y Sector_Origen)
        id_vars = ['Fecha', 'Sector_Origen'] if 'Sector_Origen' in df.columns else ['Fecha']
        regions = [c for c in df.columns if c not in id_vars and 'Unnamed' not in str(c)]
        
        melted_df = df.melt(id_vars=id_vars, value_vars=regions, var_name='Region', value_name='Demanda')
        
        print(f"   📊 Procesando {len(melted_df)} registros desagregados...")
        
        for _, row in melted_df.iterrows():
            try:
                fecha = pd.to_datetime(row['Fecha'])
                demanda_val = float(row['Demanda'])
                sector = row.get('Sector_Origen', 'Gas Natural')
                
                if demanda_val > 0:
                    item = Demand(
                        sector=str(sector)[:100],
                        region=str(row['Region'])[:100],
                        anio=fecha.year,
                        mes=fecha.month,
                        escenario='Medio', # Asumimos escenario medio por la hoja usada
                        demanda=demanda_val,
                        fecha_carga=datetime.datetime.now(datetime.timezone.utc)
                    )
                    transformed_data.append(item)
            except Exception as e:
                continue
                
    except Exception as e:
        print(f"   ❌ Error en transformación: {e}")
        import traceback
        traceback.print_exc()
            
    print(f"   ✓ {len(transformed_data):,} registros válidos listos para cargar")
    return transformed_data

def load_demand(data: list, db: Session):
    """
    Carga los datos en la base de datos usando Truncate & Load.
    """
    print(f"💾 Cargando {len(data):,} registros de Demanda...")
    try:
        deleted = db.query(Demand).delete()
        print(f"   🗑️  Eliminados {deleted} registros antiguos")
        
        # Cargar en lotes para evitar problemas de memoria si son muchos
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
    print("  🚀 ETL DE DEMANDA")
    print("="*70)
    
    df = extract_demand()
    if not df.empty:
        data = transform_demand(df)
        if data:
            db = SessionLocal()
            load_demand(data, db)
            db.close()
        else:
            print("   ⚠️ No hay datos para cargar.")
    else:
        print("   ⚠️ Falló la extracción.")
    
    print("="*70 + "\n")

if __name__ == "__main__":
    run_demand_etl()
