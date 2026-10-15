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

export interface Station {
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

export async function fetchStations(): Promise<Station[]> {
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
  if (json.errors?.length) throw new Error(`GraphQL: ${JSON.stringify(json.errors)}`);

  const stations = json.data?.supply?.stations;
  if (!Array.isArray(stations) || stations.length === 0) {
    throw new Error("Bluebikes API returned no stations");
  }
  return stations as Station[];
}
