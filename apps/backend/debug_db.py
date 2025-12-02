import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

print("Starting debug script...")

try:
    from database import SessionLocal
    import models
    from sqlalchemy import func

    db = SessionLocal()

    print("--- DEMAND REGIONS ---")
    regions = db.query(models.Demand.region, func.count(models.Demand.id)).group_by(models.Demand.region).all()
    for r in regions:
        print(f"'{r[0]}': {r[1]}")

    print("\n--- ROYALTY DEPARTMENTS ---")
    depts = db.query(models.Royalty.departamento, func.count(models.Royalty.id)).group_by(models.Royalty.departamento).all()
    for d in depts:
        print(f"'{d[0]}': {d[1]}")

    print("\n--- PRODUCTION DEPARTMENTS ---")
    prod_depts = db.query(models.Production.departamento, func.count(models.Production.id)).group_by(models.Production.departamento).all()
    for d in prod_depts:
        print(f"'{d[0]}': {d[1]}")

except Exception as e:
    print(f"Error: {e}")
