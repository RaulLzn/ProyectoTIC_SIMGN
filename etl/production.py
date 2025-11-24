import pandas as pd
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from models import Production
from database import SessionLocal
import datetime
import io

MINENERGIA_URL = "https://www.minenergia.gov.co/es/misional/hidrocarburos/funcionamiento-del-sector/gas-natural/"

def get_production_file_url():
    print("Scraping Production file URL...")
    try:
        response = requests.get(MINENERGIA_URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Logic to find the latest file. 
        # Looking for links containing "declaracion_produccion" or similar and ending in .xlsx or .xlsm
        # Based on inspection, links look like: .../declaracion_2025_2034_30102025_V2.xlsx
        
        links = soup.find_all('a', href=True)
        excel_links = [l['href'] for l in links if ('.xlsx' in l['href'] or '.xlsm' in l['href']) and 'declaracion' in l['href'].lower()]
        
        if not excel_links:
            print("No production file found.")
            return None
            
        # Return the first one found (usually the latest if top-down)
        # Ensure full URL
        url = excel_links[0]
        if not url.startswith('http'):
            url = "https://www.minenergia.gov.co" + url
            
        print(f"Found URL: {url}")
        return url
    except Exception as e:
        print(f"Error scraping URL: {e}")
        return None

def extract_production():
    url = get_production_file_url()
    if not url:
        return pd.DataFrame()
    
    print(f"Downloading Production data from {url}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Read Excel. Might need to specify sheet name or skip rows.
        # Usually these files have a specific format. 
        # For this demo, we'll try to read the first sheet and look for standard columns.
        with io.BytesIO(response.content) as f:
            df = pd.read_excel(f)
            
        return df
    except Exception as e:
        print(f"Error extracting production: {e}")
        return pd.DataFrame()

def transform_production(df: pd.DataFrame):
    print("Transforming Production data...")
    if df.empty:
        return []
    
    transformed_data = []
    
    # Basic normalization - this heavily depends on the actual file structure
    # Assuming columns like 'Campo', 'Operadora', 'Año', 'Mes', 'Producción'
    # We might need to clean column names
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    for _, row in df.iterrows():
        try:
            # Placeholder logic - adjust based on real file columns
            # If the file is a pivot or complex header, this needs more logic
            item = Production(
                campo=str(row.get('campo', 'Unknown')),
                operadora=str(row.get('operadora', 'Unknown')),
                departamento=str(row.get('departamento', '')),
                municipio=str(row.get('municipio', '')),
                anio=int(row.get('año', row.get('anio', datetime.datetime.now().year))),
                mes=int(row.get('mes', 1)),
                produccion_mensual=float(row.get('produccion', row.get('producción', 0))),
                fecha_carga=datetime.datetime.utcnow()
            )
            transformed_data.append(item)
        except Exception as e:
            # print(f"Error transforming row: {e}") # Verbose
            continue
            
    return transformed_data

def load_production(data: list, db: Session):
    print(f"Loading {len(data)} Production records...")
    try:
        db.add_all(data)
        db.commit()
        print("Production loaded successfully.")
    except Exception as e:
        print(f"Error loading production: {e}")
        db.rollback()

def run_production_etl():
    df = extract_production()
    if not df.empty:
        data = transform_production(df)
        db = SessionLocal()
        load_production(data, db)
        db.close()

if __name__ == "__main__":
    run_production_etl()
