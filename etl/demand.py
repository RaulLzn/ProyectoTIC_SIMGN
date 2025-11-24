import pandas as pd
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from models import Demand
from database import SessionLocal
import datetime
import io
import zipfile

UPME_URL = "https://www.upme.gov.co/simec/planeacion-energetica/proyeccion_de_demanda/"

def get_demand_file_url():
    print("Scraping Demand file URL...")
    try:
        response = requests.get(UPME_URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for links to Excel or Zip files containing "demanda" and "gas"
        links = soup.find_all('a', href=True)
        relevant_links = [l['href'] for l in links if ('gas' in l['href'].lower() and ('xlsx' in l['href'] or 'zip' in l['href']))]
        
        if not relevant_links:
            print("No demand file found.")
            return None
            
        url = relevant_links[0]
        if not url.startswith('http'):
            url = "https://www.upme.gov.co" + url # Adjust base URL if needed
            
        print(f"Found URL: {url}")
        return url
    except Exception as e:
        print(f"Error scraping URL: {e}")
        return None

def extract_demand():
    url = get_demand_file_url()
    if not url:
        return pd.DataFrame()
    
    print(f"Downloading Demand data from {url}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        content = response.content
        
        if url.endswith('.zip'):
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                # Find the first excel file in the zip
                excel_files = [f for f in z.namelist() if f.endswith('.xlsx') or f.endswith('.xls')]
                if excel_files:
                    with z.open(excel_files[0]) as f:
                        df = pd.read_excel(f)
                        return df
                else:
                    print("No Excel file found in zip.")
                    return pd.DataFrame()
        else:
            with io.BytesIO(content) as f:
                df = pd.read_excel(f)
                return df
                
    except Exception as e:
        print(f"Error extracting demand: {e}")
        return pd.DataFrame()

def transform_demand(df: pd.DataFrame):
    print("Transforming Demand data...")
    if df.empty:
        return []
    
    transformed_data = []
    
    # Placeholder logic - heavily dependent on file structure
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    for _, row in df.iterrows():
        try:
            item = Demand(
                sector=str(row.get('sector', 'Unknown')),
                region=str(row.get('region', 'Unknown')),
                anio=int(row.get('año', row.get('anio', datetime.datetime.now().year))),
                mes=int(row.get('mes', 1)),
                escenario=str(row.get('escenario', 'Medio')),
                demanda=float(row.get('demanda', 0)),
                fecha_carga=datetime.datetime.utcnow()
            )
            transformed_data.append(item)
        except Exception as e:
            continue
            
    return transformed_data

def load_demand(data: list, db: Session):
    print(f"Loading {len(data)} Demand records...")
    try:
        db.add_all(data)
        db.commit()
        print("Demand loaded successfully.")
    except Exception as e:
        print(f"Error loading demand: {e}")
        db.rollback()

def run_demand_etl():
    df = extract_demand()
    if not df.empty:
        data = transform_demand(df)
        db = SessionLocal()
        load_demand(data, db)
        db.close()

if __name__ == "__main__":
    run_demand_etl()
