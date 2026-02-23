import { writeFileSync } from "fs";
import { join } from "path";

const URL = "https://account.bluebikes.com/bikesharefe-gql";

const query = `
  query GetSystemSupply($input: SupplyInput) {
    supply(input: $input) {
      stations {
        stationId
        stationName
        valetName
        location { lat lng }
        bikesAvailable
        bikeDocksAvailable
        ebikesAvailable
        scootersAvailable
        totalBikesAvailable
        totalRideablesAvailable
        isValet
        isOffline
        isLightweight
        siteId
        lastUpdatedMs
      }
    }
  }
`;

interface Station {
  stationId: string;
  stationName: string;
  valetName: string | null;
  location: { lat: number; lng: number };
  bikesAvailable: number;
  bikeDocksAvailable: number;
  ebikesAvailable: number;
  scootersAvailable: number;
  totalBikesAvailable: number;
  totalRideablesAvailable: number;
  isValet: boolean;
  isOffline: boolean;
  isLightweight: boolean;
  siteId: string;
  lastUpdatedMs: number;
}

async function fetchStations(): Promise<Station[]> {
  const response = await fetch(URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      operationName: "GetSystemSupply",
      variables: { input: { regionCode: "BOS", rideablePageLimit: 1000 } },
      query,
    }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const json = await response.json();
  return json.data.supply.stations as Station[];
}

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

writeFileSync(
  join(dataDir, "stations.geojson"),
  JSON.stringify(toGeoJSON(stations), null, 2),
);
console.log("Wrote data/stations.geojson");
