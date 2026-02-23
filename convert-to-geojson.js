const fs = require("fs");
const path = require("path");

// Input and output paths
const inputPath = path.join(__dirname, "data/stations.json");
const outputPath = path.join(__dirname, "data/stations.geojson");

// Read source file
const rawData = fs.readFileSync(inputPath, "utf-8");
const json = JSON.parse(rawData);

// Extract stations
const stations = json?.data?.supply?.stations || [];

// Convert to GeoJSON FeatureCollection
const geojson = {
  type: "FeatureCollection",
  features: stations.map((station) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [station.location.lng, station.location.lat],
    },
    properties: {
      stationId: station.stationId,
      stationName: station.stationName,
      siteId: station.siteId,
      bikesAvailable: station.bikesAvailable,
      bikeDocksAvailable: station.bikeDocksAvailable,
      ebikesAvailable: station.ebikesAvailable,
      scootersAvailable: station.scootersAvailable,
      totalBikesAvailable: station.totalBikesAvailable,
      totalRideablesAvailable: station.totalRideablesAvailable,
      isValet: station.isValet,
      isOffline: station.isOffline,
      isLightweight: station.isLightweight,
      lastUpdatedMs: station.lastUpdatedMs,
      notices: station.notices,
    },
  })),
};

// Write GeoJSON output
fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));

console.log(`GeoJSON file created at: ${outputPath}`);
