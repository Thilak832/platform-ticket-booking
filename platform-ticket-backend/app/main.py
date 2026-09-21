import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.stations_seed import STATIONS_SEED
from app.database import SessionLocal
from app.models.station import Station
from app.routers import admin, auth, bookings, stations, wallet

logging.basicConfig(level=settings.LOG_LEVEL)

app = FastAPI(title="Platform Ticket Booking System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(stations.router)
app.include_router(bookings.router)
app.include_router(admin.router)
app.include_router(wallet.router)


@app.on_event("startup")
def seed_stations() -> None:
    db = SessionLocal()
    try:
        if db.query(Station).count() == 0:
            for entry in STATIONS_SEED:
                db.add(Station(**entry))
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok", "service": "platform-ticket-backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}
