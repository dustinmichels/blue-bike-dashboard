const url = "https://account.bluebikes.com/bikesharefe-gql";

const query = `
  query GetSystemSupply($input: SupplyInput) {
    supply(input: $input) {
      stations {
        stationId
        stationName
        valetName
        location {
          lat
          lng
        }
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

const body = {
  operationName: "GetSystemSupply",
  variables: {
    input: {
      regionCode: "BOS",
      rideablePageLimit: 1000,
    },
  },
  query,
};

const options = {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);

  // log data.supply.stations[0]
  console.log(data.data.supply.stations[0]);
} catch (error) {
  console.error(error);
}
