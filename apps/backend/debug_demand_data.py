from database import SessionLocal
from models import Demand
from sqlalchemy import func

db = SessionLocal()

print("--- Demand Data Debug ---")
count = db.query(Demand).count()
print(f"Total records: {count}")

print("\nDistinct Scenarios:")
scenarios = db.query(Demand.escenario).distinct().all()
print([s[0] for s in scenarios])

print("\nDistinct Sectors:")
sectors = db.query(Demand.sector).distinct().all()
print([s[0] for s in sectors])

print("\nDistinct Regions:")
regions = db.query(Demand.region).distinct().all()
print([s[0] for s in regions])

print("\nSample Record:")
sample = db.query(Demand).first()
if sample:
    print(f"Sector: {sample.sector}, Region: {sample.region}, Escenario: {sample.escenario}, Anio: {sample.anio}, Demanda: {sample.demanda}")

print("\n--- Breakdown for 2025 ---")
try:
    results = db.query(Demand).filter(Demand.anio == 2025).all()
    print(f"Total records for 2025: {len(results)}")
    
    print("\nRecords by Scenario/Sector/Region:")
    for r in results:
        print(f"Scen: {r.escenario:10} | Sect: {r.sector:15} | Reg: {r.region:20} | Val: {r.demanda}")
        
except Exception as e:
    print(f"Query Error: {e}")
