const EARTH_RADIUS_METERS = 6_371_000;

// Mirrors app/core/geo.py's Haversine implementation on the backend, so
// distances shown here match what the server computes during booking.
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

// Stations further than this from the user are treated as "not nearby" -
// beyond this, we assume the user isn't near any of our live stations
// (e.g. outside Chennai) and let them fall back to manual browsing.
export const NEARBY_RADIUS_METERS = 50_000; // 50 km
