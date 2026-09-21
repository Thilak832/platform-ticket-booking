import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.geo import distance_meters
from app.database import get_db
from app.models.station import Station
from app.schemas.station import StationOut
from app.schemas.booking import LocationVerifyRequest, LocationVerifyResponse

router = APIRouter(prefix="/api/stations", tags=["stations"])

REQUIRED_METERS = 100.0


@router.get("", response_model=list[StationOut])
def list_stations(db: Session = Depends(get_db)):
    return db.query(Station).filter(Station.is_active.is_(True)).order_by(Station.name).all()


@router.get("/{station_id}", response_model=StationOut)
def get_station(station_id: uuid.UUID, db: Session = Depends(get_db)):
    station = db.get(Station, station_id)
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")
    return station


@router.post("/verify-location", response_model=LocationVerifyResponse)
def verify_location(payload: LocationVerifyRequest, db: Session = Depends(get_db)):
    station = db.get(Station, payload.station_id)
    if not station:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")

    dist = distance_meters(payload.latitude, payload.longitude, float(station.latitude), float(station.longitude))
    return LocationVerifyResponse(verified=dist <= REQUIRED_METERS, distance_meters=round(dist, 1), required_meters=REQUIRED_METERS)
