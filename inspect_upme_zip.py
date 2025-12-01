import requests
import zipfile
import io
import pandas as pd

# URL from demand.py
URL = "https://docs.upme.gov.co/DemandayEficiencia/Documents/Anexo_Datos_Proyeccion_Demanda_Gas_Nat_2024.zip"

with open("inspection_output.txt", "w") as log:
    def log_print(msg):
        print(msg)
        log.write(str(msg) + "\n")

    log_print(f"Downloading ZIP from {URL}...")
    try:
        response = requests.get(URL, timeout=60, verify=False)
        response.raise_for_status()
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            log_print(f"\nZIP Content ({len(z.namelist())} files):")
            excel_files = [f for f in z.namelist() if f.endswith('.xlsx') or f.endswith('.xls')]
            
            for f in excel_files:
                log_print(f" - {f}")
                
            log_print("\nInspecting specific files...")
            
            # Inspect a few representative files
            files_to_inspect = [f for f in excel_files if 'agregada' in f.lower() or 'industrial' in f.lower()][:2]
            
            for file_name in files_to_inspect:
                log_print(f"\nFile: {file_name}")
                with z.open(file_name) as f:
                    xl = pd.ExcelFile(f)
                    log_print(f"  Sheets: {xl.sheet_names}")
                    
                    # Inspect first sheet
                    if xl.sheet_names:
                        sheet1 = xl.sheet_names[0]
                        log_print(f"  Preview of sheet '{sheet1}':")
                        df = pd.read_excel(f, sheet_name=sheet1, header=None, nrows=10)
                        log_print(df.to_string())

    except Exception as e:
        log_print(f"Error: {e}")
