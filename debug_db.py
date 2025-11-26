from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./data.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

try:
    # Count rows
    count = session.execute(text("SELECT COUNT(*) FROM demand")).scalar()
    print(f"Total rows in demand: {count}")

    # Distinct scenarios
    scenarios = session.execute(text("SELECT DISTINCT escenario FROM demand")).fetchall()
    print(f"Distinct scenarios: {[s[0] for s in scenarios]}")

    # Sample rows
    rows = session.execute(text("SELECT * FROM demand LIMIT 5")).fetchall()
    print("Sample rows:")
    for row in rows:
        print(row)

except Exception as e:
    print(f"Error: {e}")
finally:
    session.close()
