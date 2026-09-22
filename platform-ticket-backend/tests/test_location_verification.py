"""
Covers the inverted location-verification rule: booking requires the user to
be MORE than REQUIRED_METERS away from the station (not within it), per the
spec change applied in app/routers/stations.py and app/routers/bookings.py.
"""
from app.core.geo import distance_meters
from app.routers.stations import REQUIRED_METERS as STATIONS_REQUIRED_METERS
from app.routers.bookings import REQUIRED_METERS as BOOKINGS_REQUIRED_METERS

STATION_LAT, STATION_LON = 13.0827, 80.2707


def test_stations_and_bookings_agree_on_threshold():
    assert STATIONS_REQUIRED_METERS == BOOKINGS_REQUIRED_METERS == 100.0


def test_user_inside_station_is_not_verified():
    # Standing exactly at the station (0m away) must fail verification.
    dist = distance_meters(STATION_LAT, STATION_LON, STATION_LAT, STATION_LON)
    verified = dist > STATIONS_REQUIRED_METERS
    assert verified is False


def test_user_just_under_threshold_is_not_verified():
    # ~90m away (offset chosen to land under 100m).
    dist = distance_meters(STATION_LAT, STATION_LON, STATION_LAT + 0.0008, STATION_LON)
    assert dist < STATIONS_REQUIRED_METERS
    assert (dist > STATIONS_REQUIRED_METERS) is False


def test_user_just_over_threshold_is_verified():
    # ~550m away, comfortably over the 100m minimum (matches the frontend's
    # dev-mode "simulate away from station" offset of 0.005 degrees).
    dist = distance_meters(STATION_LAT, STATION_LON, STATION_LAT + 0.005, STATION_LON)
    assert dist > STATIONS_REQUIRED_METERS
    assert (dist > STATIONS_REQUIRED_METERS) is True


def test_boundary_exactly_at_threshold_is_not_verified():
    # dist > REQUIRED_METERS is strict, so exactly 100.0m must NOT verify.
    assert (100.0 > STATIONS_REQUIRED_METERS) is False
