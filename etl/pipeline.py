from etl.royalties import run_royalties_etl
from etl.production import run_production_etl_multi
from etl.demand import run_demand_etl
import time
import traceback

def run_pipeline():
    print("Starting ETL Pipeline...")
    start_time = time.time()
    
    try:
        # 1. Royalties
        run_royalties_etl()
        
        # 2. Production
        # Run with default limit (10 files) or 0 for all
        run_production_etl_multi(limit_files=0) 
        
        # 3. Demand
        run_demand_etl()
        
        end_time = time.time()
        print(f"\nETL Pipeline completed in {end_time - start_time:.2f} seconds.")
        
    except Exception:
        print("❌ Error in pipeline execution")
        traceback.print_exc()
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())

if __name__ == "__main__":
    run_pipeline()
