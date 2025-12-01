from fastapi import FastAPI
from database import engine, Base
from routers import api
import models

# Create tables
models.Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(title="SIMGN Backend", description="API for Natural Gas Data Integration", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable Gzip Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(api.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to SIMGN API"}
