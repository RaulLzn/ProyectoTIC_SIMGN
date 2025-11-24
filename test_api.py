"""
Script de prueba de la API REST
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("=" * 60)
    print("🧪 PRUEBAS DE LA API REST")
    print("=" * 60)
    
    try:
        # Test 1: Health check
        print("\n1️⃣ Probando /api/health...")
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📄 Response: {response.json()}")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
            return False
        
        # Test 2: Root endpoint
        print("\n2️⃣ Probando /...")
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📄 Response: {response.json()}")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
        
        # Test 3: Royalties endpoint
        print("\n3️⃣ Probando /api/royalties?limit=2...")
        response = requests.get(f"{BASE_URL}/api/royalties?limit=2", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Registros recibidos: {len(data)}")
            if data:
                print(f"   📄 Primer registro:")
                print(f"      - Departamento: {data[0].get('departamento')}")
                print(f"      - Municipio: {data[0].get('municipio')}")
                print(f"      - Campo: {data[0].get('campo')}")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
        
        # Test 4: Royalties stats
        print("\n4️⃣ Probando /api/royalties/stats...")
        response = requests.get(f"{BASE_URL}/api/royalties/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Total records: {stats.get('total_records'):,}")
            print(f"   💰 Total value: ${stats.get('total_value_liquidado'):,.2f}")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
        
        # Test 5: Production stats
        print("\n5️⃣ Probando /api/production/stats...")
        response = requests.get(f"{BASE_URL}/api/production/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Total records: {stats.get('total_records'):,}")
            print(f"   ⛽ Total production: {stats.get('total_production_kpc'):,.2f} KPC")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
        
        # Test 6: Demand stats
        print("\n6️⃣ Probando /api/demand/stats...")
        response = requests.get(f"{BASE_URL}/api/demand/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Total records: {stats.get('total_records'):,}")
            print(f"   📈 Total demand: {stats.get('total_demand_gbtud'):,.2f} GBTUD")
        else:
            print(f"   ❌ Error: Status {response.status_code}")
        
        print("\n" + "=" * 60)
        print("✅ TODAS LAS PRUEBAS DE API COMPLETADAS")
        print("=" * 60)
        print("\n💡 Accede a la documentación interactiva en:")
        print(f"   🔗 {BASE_URL}/docs")
        print("=" * 60)
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: No se pudo conectar al servidor")
        print("💡 Asegúrate de que el servidor esté corriendo con:")
        print("   uvicorn main:app --port 8000")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_api()
    exit(0 if success else 1)
