import { writeFileSync } from "fs";
import { join } from "path";
import { fetchStations, type Station } from "./lib/bluebikes.ts";

function toGeoJSON(stations: Station[]) {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [s.location.lng, s.location.lat],
      },
      properties: {
        stationId: s.stationId,
        stationName: s.stationName,
        siteId: s.siteId,
        bikesAvailable: s.bikesAvailable,
        bikeDocksAvailable: s.bikeDocksAvailable,
        ebikesAvailable: s.ebikesAvailable,
        scootersAvailable: s.scootersAvailable,
        totalBikesAvailable: s.totalBikesAvailable,
        totalRideablesAvailable: s.totalRideablesAvailable,
        isValet: s.isValet,
        isOffline: s.isOffline,
        isLightweight: s.isLightweight,
        lastUpdatedMs: s.lastUpdatedMs,
      },
    })),
  };
}

const stations = await fetchStations();
console.log(`Fetched ${stations.length} stations`);

const dataDir = join(import.meta.dirname, "data");

writeFileSync(
  join(dataDir, "stations.json"),
  JSON.stringify({ data: { supply: { stations } } }, null, 2),
);
console.log("Wrote data/stations.json");

writeFileSync(join(dataDir, "stations.geojson"), JSON.stringify(toGeoJSON(stations), null, 2));
console.log("Wrote data/stations.geojson");
