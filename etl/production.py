"""
ETL de Producción MEJORADO - Procesa los 50 archivos Excel encontrados
"""
import pandas as pd
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from models import Production
from database import SessionLocal
import datetime
import io
import re

MINENERGIA_URL = "https://www.minenergia.gov.co/es/misional/hidrocarburos/funcionamiento-del-sector/gas-natural/"
BASE_URL = "https://www.minenergia.gov.co"

def extract_all_production_urls():
    """
    Extrae TODAS las URLs de archivos Excel de producción
    """
    print("🔍 Extrayendo URLs de archivos Excel...")
    
    response = requests.get(MINENERGIA_URL, timeout=10)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, 'html.parser')
    
    all_links = soup.find_all('a', href=True)
    excel_files = []
    
    for link in all_links:
        href = link['href']
        text = link.get_text(strip=True)
        
        # Filtrar archivos Excel
        if any(ext in href.lower() for ext in ['.xlsx', '.xlsm', '.xls']):
            # Filtrar solo archivos de producción (excluir plantillas)
            if 'soporte' in text.lower() or 'declaracion' in href.lower():
                # Construir URL completa
                full_url = BASE_URL + href if not href.startswith('http') else href
                
                # Extraer período
                period_match = re.search(r'(20\d{2})[_-]*(20\d{2})?', text + href)
                period = period_match.group(0) if period_match else 'Unknown'
                
                excel_files.append({
                    'url': full_url,
                    'text': text,
                    'period': period
                })
    
    # Eliminar duplicados por URL
    unique_files = {f['url']: f for f in excel_files}
    files_list = list(unique_files.values())
    
    # Filtrar plantillas (templates)
    files_list = [f for f in files_list if 'plantilla' not in f['text'].lower() 
                  and 'formato' not in f['text'].lower()]
    
    print(f"✅ Encontrados {len(files_list)} archivos únicos de producción")
    
    return files_list

def parse_production_excel_multi_sheet(file_buffer, limit_sheets=None):
    """
    Parser especializado para archivos Excel multi-hoja con formato pivoteado
    """
    all_records = []
    
    try:
        xl_file = pd.ExcelFile(file_buffer)
        sheets = xl_file.sheet_names[:limit_sheets] if limit_sheets else xl_file.sheet_names
        
        for sheet_name in sheets:
            try:
                df = pd.read_excel(file_buffer, sheet_name=sheet_name, header=None)
                campo = sheet_name.split('_')[0] if '_' in sheet_name else sheet_name
                
                # Buscar fila de años
                year_row_idx = None
                for idx in range(min(15, len(df))):
                    row_str = df.iloc[idx].astype(str)
                    if any('año' in str(val).lower() for val in row_str):
                        year_row_idx = idx
                        break
                
                if year_row_idx is None:
                    continue
                
                month_row_idx = year_row_idx + 1
                year_row = df.iloc[year_row_idx]
                month_row = df.iloc[month_row_idx]
                
                # Mapear columnas a año/mes
                col_to_year_month = {}
                current_year = None
                
                for col_idx in range(len(year_row)):
                    year_val = str(year_row.iloc[col_idx])
                    year_match = re.search(r'20\d{2}', year_val)
                    if year_match:
                        current_year = int(year_match.group())
                    
                    month_val = str(month_row.iloc[col_idx])
                    month_map = {
                        'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4,
                        'may': 5, 'jun': 6, 'jul': 7, 'ago': 8,
                        'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
                    }
                    
                    month = None
                    for abbr, num in month_map.items():
                        if abbr in month_val.lower():
                            month = num
                            break
                    
                    if current_year and month:
                        col_to_year_month[col_idx] = (current_year, month)
                
                # Procesar datos
                data_start_row = month_row_idx + 1
                for row_idx in range(data_start_row, len(df)):
                    row = df.iloc[row_idx]
                    operadora = str(row.iloc[2]) if len(row) > 2 else None
                    
                    if not operadora or operadora == 'nan' or pd.isna(operadora):
                        continue
                    
                    for col_idx, (year, month) in col_to_year_month.items():
                        try:
                            produccion = float(row.iloc[col_idx])
                            if produccion > 0:
                                all_records.append({
                                    'campo': campo,
                                    'operadora': operadora,
                                    'anio': year,
                                    'mes': month,
                                    'produccion_mensual': produccion
                                })
                        except:
                            continue
            except:
                continue
    except Exception as e:
        print(f"     ✗ Error: {str(e)[:50]}")
    
    return pd.DataFrame(all_records) if all_records else pd.DataFrame()

def download_and_parse_excel(url):
    """
    Descarga y parsea un archivo Excel con estructura multi-hoja
    """
    try:
        print(f"  📥 {url.split('/')[-1][:70]}")
        
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        
        # Parsear con el nuevo parser
        with io.BytesIO(response.content) as f:
            df = parse_production_excel_multi_sheet(f, limit_sheets=20)  # Limitar a 20 hojas por archivo
        
        print(f"     ✓ {len(df):,} registros")
        return df
        
    except Exception as e:
        print(f"     ✗ Error: {str(e)[:50]}")
        return pd.DataFrame()

def extract_production(limit_files=10):
    """
    Extrae datos de múltiples archivos Excel
    
    Args:
        limit_files: Número máximo de archivos (0 = todos)
    """
    print("\n" + "="*70)
    print("  📦 EXTRAYENDO DATOS DE MÚLTIPLES ARCHIVOS")
    print("="*70 + "\n")
    
    # Obtener URLs
    file_list = extract_all_production_urls()
    
    if not file_list:
        print("⚠️ No se encontraron archivos")
        return pd.DataFrame()
    
    # Limitar si es necesario
    if limit_files > 0:
        file_list = file_list[:limit_files]
        print(f"📋 Procesando {len(file_list)} archivos (limitado)\n")
    else:
        print(f"📋 Procesando TODOS los {len(file_list)} archivos\n")
    
    # Descargar y consolidar
    all_dataframes = []
    
    for i, file_info in enumerate(file_list, 1):
        print(f"[{i}/{len(file_list)}] Período {file_info['period']}:")
        
        df = download_and_parse_excel(file_info['url'])
        
        if not df.empty:
            # Agregar metadata
            df['source_period'] = file_info['period']
            df['source_file'] = file_info['text']
            all_dataframes.append(df)
    
    # Consolidar
    if all_dataframes:
        combined_df = pd.concat(all_dataframes, ignore_index=True)
        print(f"\n✅ CONSOLIDADO: {len(combined_df):,} registros de {len(all_dataframes)} archivos")
        return combined_df
    else:
        print("\n⚠️ No se descargó ningún archivo exitosamente")
        return pd.DataFrame()

def transform_production(df: pd.DataFrame):
    """
    Transforma los datos con mapeo robusto de columnas
    """
    print(f"\n🔄 Transformando {len(df):,} registros...")
    
    if df.empty:
        return []
    
    transformed_data = []
    
    # Normalizar columnas
    df.columns = [str(c).strip().lower().replace(' ', '_').replace('ó', 'o').replace('ñ', 'n') 
                  for c in df.columns]
    
    print(f"   Columnas: {df.columns.tolist()[:8]}...")
    
    for _, row in df.iterrows():
        try:
            # Mapeo flexible
            campo = str(row.get('campo', row.get('field', row.get('nombre_campo', 
                                row.get('nombre', 'Unknown')))))
            
            operadora = str(row.get('operadora', row.get('operador', row.get('operator', 
                                   row.get('empresa', 'Unknown')))))
            
            departamento = str(row.get('departamento', row.get('department', 
                                      row.get('depto', ''))))
            
            municipio = str(row.get('municipio', row.get('municipality', 
                                   row.get('mpio', ''))))
            
            # Año y mes - intentar múltiples nombres
            anio = int(row.get('ano', row.get('anio', row.get('year', 
                              row.get('a_o', datetime.datetime.now().year)))))
            
            mes = int(row.get('mes', row.get('month', 1)))
            
            # Producción - intentar múltiples nombres
            produccion = float(row.get('produccion', 
                                      row.get('produccion_mensual',
                                             row.get('production',
                                                    row.get('prod', 0)))))
            
            # Solo agregar si tiene datos válidos
            if produccion > 0 and campo != 'Unknown':
                item = Production(
                    campo=campo[:100],  # Limitar longitud
                    operadora=operadora[:100],
                    departamento=departamento[:100],
                    municipio=municipio[:100],
                    anio=anio,
                    mes=mes,
                    produccion_mensual=produccion,
                    fecha_carga=datetime.datetime.utcnow()
                )
                transformed_data.append(item)
            
        except Exception as e:
            # Silenciar errores individuales
            continue
    
    print(f"   ✓ {len(transformed_data):,} registros válidos")
    return transformed_data

def load_production(data: list, db: Session):
    """
    Carga datos con truncate
    """
    print(f"\n💾 Cargando {len(data):,} registros...")
    try:
        deleted = db.query(Production).delete()
        print(f"   🗑️  Eliminados {deleted} registros antiguos")
        
        db.add_all(data)
        db.commit()
        print("   ✅ Cargados exitosamente")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        db.rollback()

def run_production_etl_multi(limit_files=10):
    """
    ETL principal con soporte para múltiples archivos
    
    Args:
        limit_files: Archivos a procesar (10 por defecto, 0 = todos)
    """
    print("\n" + "="*70)
    print("  🚀 ETL DE PRODUCCIÓN - MÚLTIPLES ARCHIVOS")
    print("="*70)
    
    try:
        # Extract
        df = extract_production(limit_files=limit_files)
        
        if not df.empty:
            # Transform
            data = transform_production(df)
            
            if data:
                # Load
                db = SessionLocal()
                load_production(data, db)
                db.close()
                
                print(f"\n{'='*70}")
                print(f"  ✅ ETL COMPLETADO: {len(data):,} registros en base de datos")
                print(f"{'='*70}")
            else:
                print("\n⚠️ No hay datos válidos después de transformación")
        else:
            print("\n⚠️ No se extrajeron datos")
            
    except Exception as e:
        print(f"\n❌ Error en ETL: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Procesar 10 archivos por defecto
    # Cambiar a 0 para procesar TODOS (50 archivos)
    run_production_etl_multi(limit_files=10)
