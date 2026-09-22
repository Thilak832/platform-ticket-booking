import pytest

from app.core.geo import distance_meters

# Chennai suburban stations used as real-world reference points.
CHENNAI_CENTRAL = (13.0827, 80.2707)
CHENNAI_EGMORE = (13.0732, 80.2609)


def test_distance_to_self_is_zero():
    assert distance_meters(13.0827, 80.2707, 13.0827, 80.2707) == pytest.approx(0.0, abs=1e-6)


def test_distance_is_symmetric():
    d1 = distance_meters(*CHENNAI_CENTRAL, *CHENNAI_EGMORE)
    d2 = distance_meters(*CHENNAI_EGMORE, *CHENNAI_CENTRAL)
    assert d1 == pytest.approx(d2, abs=1e-6)


def test_distance_between_known_chennai_stations_is_reasonable():
    # Chennai Central and Egmore are roughly 1.3km apart by straight line.
    d = distance_meters(*CHENNAI_CENTRAL, *CHENNAI_EGMORE)
    assert 1000 < d < 1700


def test_small_offset_near_100m_threshold():
    # ~0.0009 degrees latitude is close to 100m; used by the frontend's
    # "simulate away from station" dev helper (0.005 deg offset, ~550m).
    lat, lon = 13.0827, 80.2707
    d_small = distance_meters(lat, lon, lat + 0.0009, lon)
    d_large = distance_meters(lat, lon, lat + 0.005, lon)
    assert 80 < d_small < 120
    assert d_large > 500


def test_one_degree_latitude_is_about_111km():
    d = distance_meters(0.0, 0.0, 1.0, 0.0)
    assert d == pytest.approx(111_195, rel=0.01)
