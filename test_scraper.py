"""
Script de prueba para verificar cuántos archivos Excel encuentra el scraper
"""
import requests
from bs4 import BeautifulSoup
import re

MINENERGIA_URL = "https://www.minenergia.gov.co/es/misional/hidrocarburos/funcionamiento-del-sector/gas-natural/"

def test_scraper():
    print("="*70)
    print("🔍 ESCANEANDO PÁGINA DE MINENERGIA")
    print("="*70)
    print(f"URL: {MINENERGIA_URL}\n")
    
    try:
        response = requests.get(MINENERGIA_URL, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Buscar TODOS los enlaces
        all_links = soup.find_all('a', href=True)
        print(f"✓ Total de enlaces encontrados: {len(all_links)}\n")
        
        # Filtrar archivos Excel
        excel_files = []
        for link in all_links:
            href = link['href']
            text = link.get_text(strip=True)
            
            # Buscar archivos Excel
            if any(ext in href.lower() for ext in ['.xlsx', '.xlsm', '.xls']):
                # Filtrar por palabras clave relacionadas con producción
                if any(keyword in (href + text).lower() for keyword in 
                       ['declaracion', 'produccion', 'soporte', 'magnetico']):
                    
                    # Construir URL completa
                    if not href.startswith('http'):
                        full_url = "https://www.minenergia.gov.co" + href
                    else:
                        full_url = href
                    
                    # Extraer período
                    period_match = re.search(r'(20\d{2})\s*-?\s*(20\d{2})?', text + href)
                    period = period_match.group(0) if period_match else 'Unknown'
                    
                    excel_files.append({
                        'url': full_url,
                        'text': text or href.split('/')[-1],
                        'period': period
                    })
        
        # Eliminar duplicados
        unique_urls = {}
        for file in excel_files:
            url = file['url']
            if url not in unique_urls:
                unique_urls[url] = file
        
        print(f"📊 ARCHIVOS EXCEL ENCONTRADOS: {len(unique_urls)}")
        print("="*70)
        
        # Mostrar todos los archivos encontrados
        for i, (url, info) in enumerate(sorted(unique_urls.items()), 1):
            print(f"\n{i}. Período: {info['period']}")
            print(f"   Descripción: {info['text'][:60]}")
            print(f"   URL: {url[:80]}...")
        
        print("\n" + "="*70)
        print(f"✅ TOTAL: {len(unique_urls)} archivos únicos de producción")
        print("="*70)
        
        return len(unique_urls)
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return 0

if __name__ == "__main__":
    count = test_scraper()
    
    if count > 0:
        print(f"\n💡 El scraper mejorado puede procesar {count} archivos")
        print("   Esto es mucho más que el archivo único anterior!")
    else:
        print("\n⚠️  No se encontraron archivos")
