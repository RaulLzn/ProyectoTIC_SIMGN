from etl.royalties import run_royalties_etl
from etl.production import run_production_etl
from etl.demand import run_demand_etl
import time
import traceback

def run_pipeline():
    try:
        print("Starting ETL Pipeline...")
        start_time = time.time()
        
        print("\n--- Processing Royalties ---")
        run_royalties_etl()
        
        print("\n--- Processing Production ---")
        run_production_etl()
        
        print("\n--- Processing Demand ---")
        run_demand_etl()
        
        end_time = time.time()
        print(f"\nETL Pipeline completed in {end_time - start_time:.2f} seconds.")
    except Exception:
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())

if __name__ == "__main__":
    run_pipeline()
