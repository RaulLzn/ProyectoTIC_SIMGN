from fastapi import FastAPI
from database import engine, Base
from routers import api
import models

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIMGN Backend", description="API for Natural Gas Data Integration", version="1.0.0")

app.include_router(api.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to SIMGN API"}
