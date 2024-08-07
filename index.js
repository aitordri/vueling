const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Hardcoded parameters
const originCode = "BCN";
const year = 2024;
const month = 7;
const monthsRange = 17;
const currencyCode = "EUR";
const numDestinations = 0;

// New parameters for date selection
const selectedDepartureDate = "2024-09-27";
const selectedReturnDate = "2024-09-29";

const headers = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7,ca;q=0.6",
  "cache-control": "no-cache",
  origin: "https://www.vueling.com",
  pragma: "no-cache",
  priority: "u=1, i",
  referer: "https://www.vueling.com/es",
  "sec-ch-ua":
    '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
};

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Function to fetch available markets
const fetchMarkets = async () => {
  const url = "https://apiwww.vueling.com/api/Markets/GetAllMarketsSearcher";
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching markets:", error);
    return {};
  }
};

// Function to fetch and sort flights
const fetchFlights = async (origin, destination) => {
  const fileName = `${origin}_${destination}_${year}_${month}.json`;
  const filePath = path.join(dataDir, fileName);

  // Check if the file exists and is not older than 24 hours
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const now = new Date();
    const fileAge = (now - stats.mtime) / 1000 / 60 / 60; // in hours

    if (fileAge < 24) {
      console.log(`Loading cached data for ${origin} to ${destination}`);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return data;
    }
  }

  console.log(`Fetching new data for ${origin} to ${destination}`);
  const url = `https://apiwww.vueling.com/api/FlightPrice/GetAllFlights?originCode=${origin}&destinationCode=${destination}&year=${year}&month=${month}&currencyCode=${currencyCode}&monthsRange=${monthsRange}`;

  try {
    const response = await axios.get(url, { headers });
    const flights = response.data;

    // Filter out flights with null price
    const validFlights = flights.filter((flight) => flight.Price !== null);

    // Sort by price
    validFlights.sort((a, b) => a.Price - b.Price);

    // Save the data to file
    fs.writeFileSync(filePath, JSON.stringify(validFlights));

    return validFlights;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};

// Function to format price to two decimal places
const formatPrice = (price) => {
  return price.toFixed(2);
};

// Function to find round trips for specific dates
const findRoundTrips = (
  outboundFlights,
  returnFlights,
  departureDate,
  returnDate
) => {
  const roundTrips = [];

  const filteredOutboundFlights = outboundFlights.filter(
    (flight) => flight.DepartureDate.split("T")[0] === departureDate
  );

  const filteredReturnFlights = returnFlights.filter(
    (flight) => flight.DepartureDate.split("T")[0] === returnDate
  );

  filteredOutboundFlights.forEach((outbound) => {
    filteredReturnFlights.forEach((returnFlight) => {
      roundTrips.push({
        outbound: outbound,
        returnFlight: returnFlight,
        totalPrice: outbound.Price + returnFlight.Price,
      });
    });
  });

  return roundTrips.sort((a, b) => a.totalPrice - b.totalPrice);
};

// Function to find 2-night trips
const find2NightTrips = (outboundFlights, returnFlights) => {
  const trips = [];

  outboundFlights.forEach((outbound) => {
    const outboundDate = new Date(outbound.DepartureDate);
    const returnDate = new Date(outboundDate);
    returnDate.setDate(returnDate.getDate() + 2);

    const matchingReturnFlights = returnFlights.filter((returnFlight) => {
      const returnFlightDate = new Date(returnFlight.DepartureDate);
      return returnFlightDate.toDateString() === returnDate.toDateString();
    });

    matchingReturnFlights.forEach((returnFlight) => {
      trips.push({
        outbound: outbound,
        returnFlight: returnFlight,
        totalPrice: outbound.Price + returnFlight.Price,
      });
    });
  });

  return trips.sort((a, b) => a.totalPrice - b.totalPrice);
};

// Main function
const main = async () => {
  const markets = await fetchMarkets();
  const destinations = markets[originCode] || [];

  if (destinations.length === 0) {
    console.log(`No available destinations from ${originCode}`);
    return;
  }

  let selectedDestinations = destinations;
  if (numDestinations > 0 && numDestinations <= destinations.length) {
    selectedDestinations = destinations.slice(0, numDestinations);
  }

  console.log(`You are travelling from: ${originCode}`);
  console.log(`Departure date: ${selectedDepartureDate}`);
  console.log(`Return date: ${selectedReturnDate}`);
  console.log("\nSearching for the cheapest flights...\n");

  const allRoundTrips = [];
  const allSoloFlights = [];
  const all2NightTrips = [];

  for (let dest of selectedDestinations) {
    const destinationCode = dest.DestinationCode;

    const outboundFlights = await fetchFlights(originCode, destinationCode);
    const returnFlights = await fetchFlights(destinationCode, originCode);

    const roundTrips = findRoundTrips(
      outboundFlights,
      returnFlights,
      selectedDepartureDate,
      selectedReturnDate
    );

    allRoundTrips.push(
      ...roundTrips.map((trip) => ({
        ...trip,
        destination: destinationCode,
      }))
    );

    // Add solo flights with destination information
    allSoloFlights.push(
      ...outboundFlights.map((flight) => ({
        ...flight,
        origin: originCode,
        destination: destinationCode,
      }))
    );

    // Find 2-night trips
    const twoNightTrips = find2NightTrips(outboundFlights, returnFlights);
    all2NightTrips.push(
      ...twoNightTrips.map((trip) => ({
        ...trip,
        destination: destinationCode,
      }))
    );
  }

  // Sort all round trips by total price
  allRoundTrips.sort((a, b) => a.totalPrice - b.totalPrice);

  // Display top 20 cheapest round trips
  console.log("Top 20 cheapest round-trip flights for selected dates:");
  allRoundTrips.slice(0, 20).forEach((trip, index) => {
    console.log(`\n${index + 1}. ${originCode} to ${trip.destination}`);
    console.log(
      `   Outbound: ${trip.outbound.DepartureDate} - ${formatPrice(
        trip.outbound.Price
      )} ${currencyCode}`
    );
    console.log(
      `   Return: ${trip.returnFlight.DepartureDate} - ${formatPrice(
        trip.returnFlight.Price
      )} ${currencyCode}`
    );
    console.log(
      `   Total Price: ${formatPrice(trip.totalPrice)} ${currencyCode}`
    );
  });

  // Sort and display top 10 cheapest solo flights
  console.log("\nTop 10 cheapest solo flights:");
  allSoloFlights.sort((a, b) => a.Price - b.Price);
  allSoloFlights.slice(0, 10).forEach((flight, index) => {
    console.log(`\n${index + 1}. ${flight.origin} to ${flight.destination}`);
    console.log(
      `   Departure: ${flight.DepartureDate} - ${formatPrice(
        flight.Price
      )} ${currencyCode}`
    );
  });

  // Sort and display top 20 cheapest 2-night trips
  console.log("\nTop 20 cheapest 2-night trips:");
  all2NightTrips.sort((a, b) => a.totalPrice - b.totalPrice);
  all2NightTrips.slice(0, 20).forEach((trip, index) => {
    console.log(`\n${index + 1}. ${originCode} to ${trip.destination}`);
    console.log(
      `   Outbound: ${trip.outbound.DepartureDate} - ${formatPrice(
        trip.outbound.Price
      )} ${currencyCode}`
    );
    console.log(
      `   Return: ${trip.returnFlight.DepartureDate} - ${formatPrice(
        trip.returnFlight.Price
      )} ${currencyCode}`
    );
    console.log(
      `   Total Price: ${formatPrice(trip.totalPrice)} ${currencyCode}`
    );
  });
};

main();
