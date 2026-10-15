# Blue Bike Dashboard

An interactive map of [Bluebikes](https://bluebikes.com/) stations in the Boston area. It shows how many bikes, e-bikes, and docks each station has, with totals for the whole system or for a single town.

## Features

- **Station map**: stations are colored by availability: red (0), yellow (1), green (2+). Use the toggle to switch between **bikes** and **docks**. Offline stations show as ✖.
- **Station details**: click a station to see its bikes, e-bikes, and open docks.
- **Town filter**: pick a town from the dropdown or click it on the map to limit the stats to stations inside that town. The dropdown lists only towns that have stations.
- **Live refresh**: the map first loads a bundled snapshot (`data/stations.geojson`). The refresh button pulls live data from the Bluebikes API through a Netlify function.

## Stack

- [Vite](https://vite.dev/) + TypeScript
- [MapLibre GL JS](https://maplibre.org/) with [OpenFreeMap](https://openfreemap.org/) tiles
- [Turf.js](https://turfjs.org/) to check which town each station is in
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Lucide](https://lucide.dev/) icons
- [Netlify](https://www.netlify.com/) for hosting and the API proxy function

## Project structure

```
index.html                  Page layout and sidebar UI
src/main.ts                 Map, data loading, town filtering, stats
netlify/functions/
  get-bikes.js              Proxy to the Bluebikes GraphQL API (avoids CORS)
lib/bluebikes.ts            Bluebikes GraphQL query and station fetch, shared by the scripts
refresh-stations.ts         Script that refreshes the bundled station snapshot
collect-stations.ts         Script that appends one availability snapshot to a CSV
.github/workflows/
  collect-stations.yml      Scheduled run of collect-stations.ts every 30 minutes
data/
  stations.json             Raw API response snapshot
  stations.geojson          Station snapshot loaded on first page load
  towns.geojson             Town boundary polygons (TOWN_ID, TOWN)
  Oct15-16.csv              Station availability history, sampled every 30 minutes
```

## Development

Requires [Bun](https://bun.sh/).

```sh
bun install
bun run dev        # Vite dev server
```

The refresh button calls `/.netlify/functions/get-bikes`, which the plain Vite server does not serve. To test live refresh locally, run the app through the [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```sh
netlify dev
```

### Scripts

| Command                                 | Description                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `bun run dev`                           | Start the Vite dev server                                                                                  |
| `bun run build`                         | Build to `dist/` and copy `data/` into it                                                                  |
| `bun run preview`                       | Preview the production build                                                                               |
| `bun run refresh-stations`              | Fetch current stations from the Bluebikes API and rewrite `data/stations.json` and `data/stations.geojson` |
| `bun run collect-stations <output.csv>` | Fetch current stations and append one row per station to `<output.csv>` (header added if the file is new)  |
| `bun run fmt`                           | Format the code with oxfmt                                                                                 |

### Collecting history

`.github/workflows/collect-stations.yml` runs `collect-stations.ts` every 30 minutes and commits the rows to the file in `OUTPUT`. Once `COLLECT_UNTIL` has passed, the next run disables the workflow. To collect another window, change `OUTPUT` and `COLLECT_UNTIL`, then re-enable the workflow in the Actions tab.

CSV columns: `collectedAt` (UTC time of the fetch), `stationId`, `bikesAvailable`, `ebikesAvailable`, `bikeDocksAvailable`, `scootersAvailable`, `isOffline`, `lastUpdatedMs` (the station's last report to Bluebikes, epoch ms). Join on `stationId` with `data/stations.json` for names and locations.

Commits include `[skip netlify]` so data commits do not trigger deploys. GitHub may start scheduled runs late or skip them under load, so samples are not exactly 30 minutes apart.

## Deployment

The app deploys to Netlify. `netlify.toml` runs `bun run build`, publishes `dist/`, and deploys the functions in `netlify/functions/`.

## Author

[Dustin Michels](https://dustinmichels.com/)
