const searchVuelingFlights = require("./flight");

async function performSearch() {
  try {
    console.log("Iniciando búsqueda de vuelos...");

    const origin = "BCN";
    const destination = "GVA";
    const departureDate = "15/10/2024";
    const returnDate = "20/12/2024";

    console.log(`Buscando vuelos de ${origin} a ${destination}`);
    console.log(`Fecha de salida: ${departureDate}`);
    console.log(`Fecha de regreso: ${returnDate}`);

    const flights = await searchVuelingFlights(
      origin,
      destination,
      departureDate,
      returnDate
    );

    if (flights && flights.outboundFlights.length > 0) {
      let totalPrice = 0;

      console.log("\nVuelos de ida encontrados:");
      flights.outboundFlights.forEach((flight, index) => {
        console.log(`\nVuelo ${index + 1}:`);
        console.log(`  Número de vuelo: ${flight.flightNumber}`);
        console.log(`  Desde: ${flight.from} a ${flight.to}`);
        console.log(`  Salida: ${flight.departureTime}`);
        console.log(`  Llegada: ${flight.arrivalTime}`);
        console.log(`  Precio: ${flight.price}`);

        // Parse the price and add it to the total
        const price = parseFloat(flight.price.replace(/[^\d.-]/g, ""));
        if (!isNaN(price)) {
          totalPrice += price;
        }
      });

      console.log("\nVuelos de vuelta encontrados:");
      flights.inboundFlights.forEach((flight, index) => {
        console.log(`\nVuelo ${index + 1}:`);
        console.log(`  Número de vuelo: ${flight.flightNumber}`);
        console.log(`  Desde: ${flight.from} a ${flight.to}`);
        console.log(`  Salida: ${flight.departureTime}`);
        console.log(`  Llegada: ${flight.arrivalTime}`);
        console.log(`  Precio: ${flight.price}`);

        // Parse the price and add it to the total
        const price = parseFloat(flight.price.replace(/[^\d.-]/g, ""));
        if (!isNaN(price)) {
          totalPrice += price;
        }
      });

      console.log(
        `\nPrecio total para las fechas ${departureDate} - ${returnDate}: €${totalPrice.toFixed(
          2
        )}`
      );
    } else {
      console.log(
        "No se encontraron vuelos o ocurrió un error durante la búsqueda."
      );
    }
  } catch (error) {
    console.error("Error al realizar la búsqueda:", error);
  }
}

performSearch();
