// Appends one snapshot of every station's availability to a CSV.
// Usage: bun run collect-stations.ts data/Oct15-16.csv
import { appendFileSync, existsSync } from "fs";
import { fetchStations } from "./lib/bluebikes.ts";

const out = process.argv[2];
if (!out) throw new Error("Usage: bun run collect-stations.ts <output.csv>");

const HEADER =
  "collectedAt,stationId,bikesAvailable,ebikesAvailable,bikeDocksAvailable,scootersAvailable,isOffline,lastUpdatedMs\n";

const stations = await fetchStations();
const collectedAt = new Date().toISOString();

const rows = stations
  .map((s) =>
    [
      collectedAt,
      s.stationId,
      s.bikesAvailable,
      s.ebikesAvailable,
      s.bikeDocksAvailable,
      s.scootersAvailable,
      s.isOffline,
      s.lastUpdatedMs,
    ].join(","),
  )
  .join("\n");

appendFileSync(out, (existsSync(out) ? "" : HEADER) + rows + "\n");
console.log(`Appended ${stations.length} stations at ${collectedAt} to ${out}`);
