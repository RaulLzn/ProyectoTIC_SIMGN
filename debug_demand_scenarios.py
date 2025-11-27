from sqlalchemy import create_engine, text
import pandas as pd

# Database connection
DATABASE_URL = "sqlite:///./data.db"
engine = create_engine(DATABASE_URL)

def check_demand_scenarios():
    with engine.connect() as connection:
        # 1. Get distinct scenarios
        query_scenarios = text("SELECT DISTINCT escenario FROM demand")
        result_scenarios = connection.execute(query_scenarios).fetchall()
        scenarios = [row[0] for row in result_scenarios]
        print(f"Distinct Scenarios: {scenarios}")

        # 2. Check sample data for each scenario
        for scenario in scenarios:
            print(f"\n--- Sample data for Scenario: {scenario} ---")
            query_sample = text(f"SELECT * FROM demand WHERE escenario = '{scenario}' LIMIT 5")
            result_sample = connection.execute(query_sample).fetchall()
            for row in result_sample:
                print(row)

        # 3. Check if there is overlap in dates for different scenarios
        print("\n--- Checking overlap for a specific date (e.g., 2024-01) ---")
        query_overlap = text("SELECT escenario, SUM(demanda) as total_demanda FROM demand WHERE anio = 2024 AND mes = 1 GROUP BY escenario")
        result_overlap = connection.execute(query_overlap).fetchall()
        for row in result_overlap:
            print(row)

        # 4. Check Min and Max Year
        print("\n--- Checking Year Range ---")
        query_years = text("SELECT MIN(anio), MAX(anio) FROM demand")
        result_years = connection.execute(query_years).fetchone()
        print(f"Year Range: {result_years[0]} - {result_years[1]}")

if __name__ == "__main__":
    check_demand_scenarios()
