import * as turf from '@turf/turf'
import type { FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson'
import type { GeoJSONSource } from 'maplibre-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [-71.06, 42.39],
  zoom: 11,
})

let stationsData: FeatureCollection<Point> | null = null
let townsData: FeatureCollection<Polygon | MultiPolygon> | null = null
let selectedTownId: number | null = null

const statsTitle = document.getElementById('statsTitle') as HTMLHeadingElement
const statStations = document.getElementById('stat-stations') as HTMLSpanElement
const statBikes = document.getElementById('stat-bikes') as HTMLSpanElement
const statEbikes = document.getElementById('stat-ebikes') as HTMLSpanElement
const statDocks = document.getElementById('stat-docks') as HTMLSpanElement
const townSelect = document.getElementById('townSelect') as HTMLSelectElement
const loadingDiv = document.getElementById('loading') as HTMLDivElement

/* ------------------ DATA LOADING ------------------ */

async function loadInitialStations() {
  const res = await fetch('data/stations.geojson')
  const data = await res.json()
  setStationsData(data)
}

async function fetchStationsFromAPI() {
  loadingDiv.classList.remove('hidden')
  loadingDiv.classList.add('flex')
  try {
    const url = '/.netlify/functions/get-bikes'
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
          `
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operationName: 'GetSystemSupply',
        variables: {
          input: { regionCode: 'BOS', rideablePageLimit: 1000 },
        },
        query,
      }),
    })
    const result = await response.json()

    const stations = result.data.supply.stations

    const geojson: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: stations.map((s: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [s.location.lng, s.location.lat],
        },
        properties: {
          stationId: s.stationId,
          stationName: s.stationName,
          bikesAvailable: s.bikesAvailable,
          ebikesAvailable: s.ebikesAvailable,
          bikeDocksAvailable: s.bikeDocksAvailable,
        },
      })),
    }

    setStationsData(geojson)
  } catch (err) {
    console.error(err)
    alert('Failed to fetch API data')
  } finally {
    loadingDiv.classList.add('hidden')
    loadingDiv.classList.remove('flex')
  }
}

function setStationsData(data: FeatureCollection<Point>) {
  stationsData = data

  if (map.getSource('stations')) {
    ;(map.getSource('stations') as GeoJSONSource).setData(stationsData)
  } else {
    map.addSource('stations', { type: 'geojson', data })
    map.addLayer({
      id: 'stations-circle',
      type: 'circle',
      source: 'stations',
      paint: {
        'circle-radius': 6,
        'circle-color': '#22c55e',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    })

    map.on('click', 'stations-circle', (e) => {
      const f = e.features![0]
      const p = f.properties
      new maplibregl.Popup()
        .setLngLat((f.geometry as Point).coordinates as [number, number])
        .setHTML(
          `<div class="p-2 font-sans">
             <h3 class="font-bold text-slate-800 text-base mb-2 border-b border-slate-200 pb-1">${p.stationName}</h3>
             <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
               <div class="text-slate-500 font-medium">Bikes</div>
               <div class="font-semibold text-blue-600 text-right">${p.bikesAvailable}</div>
               <div class="text-slate-500 font-medium">E-Bikes</div>
               <div class="font-semibold text-indigo-600 text-right">${p.ebikesAvailable}</div>
               <div class="text-slate-500 font-medium border-t border-slate-100 pt-1 mt-1">Docks</div>
               <div class="font-semibold text-slate-700 text-right border-t border-slate-100 pt-1 mt-1">${p.bikeDocksAvailable}</div>
             </div>
           </div>`
        )
        .addTo(map)
    })

    map.on('mouseenter', 'stations-circle', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'stations-circle', () => {
      map.getCanvas().style.cursor = ''
    })

    zoomToStations()
    loadTowns()
  }

  updateStationsColor()
  rebuildTownDropdown()
  updateStats()
}

function zoomToStations() {
  if (!stationsData || stationsData.features.length === 0) return
  const [minLng, minLat, maxLng, maxLat] = turf.bbox(stationsData)
  map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    { padding: 40, duration: 1500 }
  )
}

/* ------------------ TOWNS ------------------ */

async function loadTowns() {
  const res = await fetch('data/towns.geojson')
  const data = await res.json()
  townsData = data
  map.addSource('towns', { type: 'geojson', data })
  map.addLayer(
    {
      id: 'towns-fill',
      type: 'fill',
      source: 'towns',
      paint: { 'fill-color': '#94a3b8', 'fill-opacity': 0.15 },
    },
    'stations-circle'
  )
  map.addLayer(
    {
      id: 'towns-selected-fill',
      type: 'fill',
      source: 'towns',
      paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.3 },
      filter: ['==', 'TOWN_ID', -1],
    },
    'stations-circle'
  )
  map.addLayer(
    {
      id: 'towns-outline',
      type: 'line',
      source: 'towns',
      paint: { 'line-color': '#cbd5e1', 'line-width': 1 },
    },
    'stations-circle'
  )
  map.addLayer(
    {
      id: 'towns-highlight',
      type: 'line',
      source: 'towns',
      paint: { 'line-color': '#2563eb', 'line-width': 2 },
      filter: ['==', 'TOWN_ID', -1],
    },
    'stations-circle'
  )

  map.on('click', 'towns-fill', (e) => {
    const townId = e.features![0].properties!.TOWN_ID
    const alreadySelected = townId === selectedTownId
    selectTown(alreadySelected ? null : townId)
  })
  map.on('mouseenter', 'towns-fill', () => {
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'towns-fill', () => {
    map.getCanvas().style.cursor = ''
  })

  rebuildTownDropdown()
}

function rebuildTownDropdown() {
  if (!townsData || !stationsData) return

  townSelect.innerHTML = '<option value="">Select a town</option>'

  const townsWithStations = townsData.features.filter((town) =>
    stationsData!.features.some((st) =>
      turf.booleanPointInPolygon(st.geometry, town.geometry)
    )
  )

  if (map.getSource('towns')) {
    ;(map.getSource('towns') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: townsWithStations,
    })
  }

  townsWithStations.forEach((f) => {
    const option = document.createElement('option')
    option.value = f.properties!.TOWN_ID
    option.textContent = f.properties!.TOWN
    townSelect.appendChild(option)
  })
}

function selectTown(id: number | null) {
  selectedTownId = id
  const filter = id ? ['==', 'TOWN_ID', id] : ['==', 'TOWN_ID', -1]
  map.setFilter('towns-highlight', filter as any)
  map.setFilter('towns-selected-fill', filter as any)
  townSelect.value = id !== null ? String(id) : ''
  updateStats()
}

/* ------------------ STYLING & STATS ------------------ */

document
  .querySelectorAll('input[name="availability"]')
  .forEach((r) => r.addEventListener('change', updateStationsColor))

function updateStationsColor() {
  if (!map.getLayer('stations-circle')) return

  const mode = (
    document.querySelector(
      'input[name="availability"]:checked'
    ) as HTMLInputElement
  ).value

  const colors = { red: '#ef4444', yellow: '#eab308', green: '#22c55e' }
  map.setPaintProperty(
    'stations-circle',
    'circle-color',
    mode === 'bikes'
      ? [
          'case',
          ['==', ['get', 'bikesAvailable'], 0],
          colors.red,
          ['==', ['get', 'bikesAvailable'], 1],
          colors.yellow,
          colors.green,
        ]
      : [
          'case',
          ['==', ['get', 'bikeDocksAvailable'], 0],
          colors.red,
          ['==', ['get', 'bikeDocksAvailable'], 1],
          colors.yellow,
          colors.green,
        ]
  )
}

function updateStats() {
  if (!stationsData) return

  let filtered = stationsData.features
  let townName: string | null = null

  if (selectedTownId && townsData) {
    const townFeature = townsData.features.find(
      (f) => f.properties!.TOWN_ID == selectedTownId
    )
    if (townFeature) {
      townName = townFeature.properties!.TOWN
      filtered = stationsData.features.filter((s) =>
        turf.booleanPointInPolygon(s.geometry, townFeature.geometry)
      )
    }
  }

  const title = townName
    ? `Stats for ${townName} | All Stations`
    : 'Stats for All Stations'

  const num = filtered.length
  const bikes = filtered.reduce(
    (sum, s) => sum + Number(s.properties!.bikesAvailable),
    0
  )
  const ebikes = filtered.reduce(
    (sum, s) => sum + Number(s.properties!.ebikesAvailable),
    0
  )
  const docks = filtered.reduce(
    (sum, s) => sum + Number(s.properties!.bikeDocksAvailable),
    0
  )

  statsTitle.textContent = title
  statStations.textContent = num.toString()
  statBikes.textContent = bikes.toString()
  statEbikes.textContent = ebikes.toString()
  statDocks.textContent = docks.toString()
}

townSelect.addEventListener('change', (e) => {
  const val = (e.target as HTMLSelectElement).value
  selectTown(val ? parseInt(val) : null)
})

document
  .getElementById('refreshBtn')!
  .addEventListener('click', fetchStationsFromAPI)

/* ------------------ INITIAL LOAD ------------------ */

map.on('load', async () => {
  await loadInitialStations()

  const mapLoadingDiv = document.getElementById('map-loading')
  if (mapLoadingDiv) {
    mapLoadingDiv.classList.add('opacity-0', 'pointer-events-none')
    setTimeout(() => {
      mapLoadingDiv.classList.add('hidden')
    }, 500)
  }
})
