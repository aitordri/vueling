const searchVuelingFlights = require("./flight");

async function performSearch() {
  try {
    console.log("Iniciando búsqueda de vuelos...");

    const origin = "BCN";
    const destination = "GVA";

    const dateRanges = [
      { departure: "04/10/2024", return: "06/10/2024" },
      { departure: "11/10/2024", return: "13/10/2024" },
      { departure: "18/10/2024", return: "20/10/2024" },
      { departure: "25/10/2024", return: "27/10/2024" },
      { departure: "01/11/2024", return: "03/11/2024" },
      { departure: "08/11/2024", return: "10/11/2024" },
      { departure: "15/11/2024", return: "17/11/2024" },
      { departure: "22/11/2024", return: "24/11/2024" },
      { departure: "29/11/2024", return: "01/12/2024" },
      { departure: "06/12/2024", return: "08/12/2024" },
      { departure: "13/12/2024", return: "15/12/2024" },
      { departure: "20/12/2024", return: "22/12/2024" },
      { departure: "27/12/2024", return: "29/12/2024" },
      { departure: "03/01/2025", return: "05/01/2025" },
      { departure: "10/01/2025", return: "12/01/2025" },
      { departure: "17/01/2025", return: "19/01/2025" },
      { departure: "24/01/2025", return: "26/01/2025" },
      { departure: "31/01/2025", return: "02/02/2025" },
      { departure: "07/02/2025", return: "09/02/2025" },
      { departure: "14/02/2025", return: "16/02/2025" },
      { departure: "21/02/2025", return: "23/02/2025" },
      { departure: "28/02/2025", return: "02/03/2025" },
      { departure: "07/03/2025", return: "09/03/2025" },
      { departure: "14/03/2025", return: "16/03/2025" },
      { departure: "21/03/2025", return: "23/03/2025" },
      { departure: "28/03/2025", return: "30/03/2025" },
    ];

    let cheapestOption = null;

    for (let dateRange of dateRanges) {
      const departureDate = dateRange.departure;
      const returnDate = dateRange.return;

      console.log(`\nBuscando vuelos de ${origin} a ${destination}`);
      console.log(`Fecha de salida: ${departureDate}`);
      console.log(`Fecha de regreso: ${returnDate}`);

      const flights = await searchVuelingFlights(
        origin,
        destination,
        departureDate,
        returnDate
      );

      if (
        flights &&
        flights.outboundFlights.length > 0 &&
        flights.inboundFlights.length > 0
      ) {
        const cheapestOutbound = flights.outboundFlights.reduce((min, flight) =>
          flight.price < min.price ? flight : min
        );
        const cheapestInbound = flights.inboundFlights.reduce((min, flight) =>
          flight.price < min.price ? flight : min
        );

        const totalPrice = cheapestOutbound.price + cheapestInbound.price;

        console.log("\nVuelo de ida más barato:");
        console.log(`  Número de vuelo: ${cheapestOutbound.flightNumber}`);
        console.log(
          `  Desde: ${cheapestOutbound.from} a ${cheapestOutbound.to}`
        );
        console.log(`  Salida: ${cheapestOutbound.departureTime}`);
        console.log(`  Llegada: ${cheapestOutbound.arrivalTime}`);
        console.log(`  Precio: ${cheapestOutbound.price}`);

        console.log("\nVuelo de vuelta más barato:");
        console.log(`  Número de vuelo: ${cheapestInbound.flightNumber}`);
        console.log(`  Desde: ${cheapestInbound.from} a ${cheapestInbound.to}`);
        console.log(`  Salida: ${cheapestInbound.departureTime}`);
        console.log(`  Llegada: ${cheapestInbound.arrivalTime}`);
        console.log(`  Precio: ${cheapestInbound.price}`);

        console.log(
          `\nPrecio total para las fechas ${departureDate} - ${returnDate}: ${totalPrice}`
        );

        if (!cheapestOption || totalPrice < cheapestOption.totalPrice) {
          cheapestOption = {
            departureDate,
            returnDate,
            totalPrice,
            outboundFlight: cheapestOutbound,
            inboundFlight: cheapestInbound,
          };
        }
      } else {
        console.log(
          "No se encontraron vuelos o ocurrió un error durante la búsqueda."
        );
      }
    }

    if (cheapestOption) {
      console.log(
        `\nLa opción más barata es del ${cheapestOption.departureDate} al ${cheapestOption.returnDate} con un precio total de ${cheapestOption.totalPrice}`
      );
      console.log("Detalles del vuelo de ida más barato:");
      console.log(
        `  Número de vuelo: ${cheapestOption.outboundFlight.flightNumber}`
      );
      console.log(`  Salida: ${cheapestOption.outboundFlight.departureTime}`);
      console.log(`  Precio: ${cheapestOption.outboundFlight.price}`);
      console.log("Detalles del vuelo de vuelta más barato:");
      console.log(
        `  Número de vuelo: ${cheapestOption.inboundFlight.flightNumber}`
      );
      console.log(`  Salida: ${cheapestOption.inboundFlight.departureTime}`);
      console.log(`  Precio: ${cheapestOption.inboundFlight.price}`);
    } else {
      console.log("No se encontraron vuelos en ninguna de las fechas.");
    }
  } catch (error) {
    console.error("Error al realizar la búsqueda:", error);
  }
}

performSearch();
