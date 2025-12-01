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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], # Explicitly allow frontend
    allow_origin_regex=".*", # Keep regex for flexibility if needed, but explicit origins are safer/better
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
