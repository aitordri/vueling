const puppeteer = require("puppeteer");

async function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function searchVuelingFlights(
  origin,
  destination,
  departureDate,
  returnDate
) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  const page = await browser.newPage();

  try {
    console.log("Navigating to Vueling search page...");
    await page.goto("https://tickets.vueling.com/ScheduleSelectNew.aspx", {
      waitUntil: "networkidle0",
    });
    await delay(200);

    console.log("Checking for cookie banner...");
    const cookieBannerSelector = "#onetrust-accept-btn-handler";
    const cookieBanner = await page.$(cookieBannerSelector);
    if (cookieBanner) {
      console.log("Closing cookie banner...");
      await page.click(cookieBannerSelector);
      await page.waitForSelector(cookieBannerSelector, { hidden: true });
    }
    await delay(500);

    console.log(`Filling in origin (${origin})...`);
    await page.type(
      "#AvailabilitySearchInputSearchView_TextBoxMarketOrigin1",
      origin,
      { delay: 100 }
    );
    await page.waitForSelector(".dropDown_content ul li a");
    await delay(500);
    await page.click(`.dropDown_content ul li a[data-id-code="${origin}"]`);
    await delay(500);

    console.log(`Filling in destination (${destination})...`);
    await page.type(
      "#AvailabilitySearchInputSearchView_TextBoxMarketDestination1",
      destination,
      { delay: 100 }
    );
    await page.waitForSelector(".dropDown_content ul li a");
    await delay(500);
    await page.click(
      `.dropDown_content ul li a[data-id-code="${destination}"]`
    );
    await delay(500);

    async function selectDate(dateString) {
      const [day, month, year] = dateString.split("/");
      console.log(`Selecting date: ${day}/${month}/${year}`);

      await page.evaluate(
        async (day, month, year) => {
          const monthNames = [
            "enero",
            "febrero",
            "marzo",
            "abril",
            "mayo",
            "junio",
            "julio",
            "agosto",
            "septiembre",
            "octubre",
            "noviembre",
            "diciembre",
          ];
          const targetMonth = monthNames[parseInt(month) - 1];

          function getVisibleMonth() {
            return document
              .querySelector(".ui-datepicker-month")
              .textContent.trim()
              .toLowerCase();
          }

          function getVisibleYear() {
            return document
              .querySelector(".ui-datepicker-year")
              .textContent.trim();
          }

          console.log(`Target month: ${targetMonth}`);
          console.log(`Target year: ${year}`);

          while (
            getVisibleYear() < year ||
            (getVisibleYear() === year &&
              monthNames.indexOf(getVisibleMonth()) <
                monthNames.indexOf(targetMonth))
          ) {
            console.log(`Current month: ${getVisibleMonth()}`);
            console.log(`Current year: ${getVisibleYear()}`);
            const nextButton = document.querySelector(".ui-datepicker-next");
            if (
              nextButton &&
              !nextButton.classList.contains("ui-state-disabled")
            ) {
              console.log("Clicking next button");
              nextButton.click();
            } else {
              console.log("No se puede avanzar más en el calendario");
              break;
            }
          }

          while (
            getVisibleYear() > year ||
            (getVisibleYear() === year &&
              monthNames.indexOf(getVisibleMonth()) >
                monthNames.indexOf(targetMonth))
          ) {
            console.log(`Current month: ${getVisibleMonth()}`);
            console.log(`Current year: ${getVisibleYear()}`);
            const prevButton = document.querySelector(".ui-datepicker-prev");
            if (
              prevButton &&
              !prevButton.classList.contains("ui-state-disabled")
            ) {
              console.log("Clicking previous button");
              prevButton.click();
            } else {
              console.log("No se puede retroceder más en el calendario");
              break;
            }
          }

          console.log("Reached target month and year");

          const dateElements = document.querySelectorAll(
            "#ui-datepicker-div .ui-datepicker-calendar td"
          );
          for (let elem of dateElements) {
            // Change the bg color of the selected date
            elem.style.backgroundColor = "red";

            // wait for 1 second
            await new Promise((resolve) => setTimeout(resolve, 10));

            console.log(`Checking date element for day ${day} ...`);
            console.log(elem.textContent.trim());

            if (
              Number(elem.textContent.trim()) === Number(day) &&
              !elem.classList.contains("ui-datepicker-unselectable") &&
              !elem.classList.contains("ui-state-disabled")
            ) {
              const link = elem.querySelector("a");
              if (link) {
                console.log(`Found date element for day ${day}`);

                if (elem.classList.contains("ui-state-promo")) {
                  console.log(`Date ${day} is promoted`);
                }
                console.log("Clicking link");
                link.click();
                return true;
              }
            }
          }
          console.log("No se pudo seleccionar la fecha");
          return false;
        },
        day,
        month,
        year
      );
      console.log("Date selection complete");

      await delay(500);
    }

    console.log("Selecting departure date...");
    await page.click("#marketDate1");
    await page.waitForSelector("#ui-datepicker-div");
    await delay(500);
    await selectDate(departureDate);

    console.log("Selecting return date...");
    await page.click("#marketDate2");
    await page.waitForSelector("#ui-datepicker-div");
    await delay(500);
    await selectDate(returnDate);

    console.log("Clicking the search button...");
    await page.click(
      "#AvailabilitySearchInputSearchView_btnClickToSearchNormal"
    );

    console.log("Waiting for results page to load...");
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 });
    await delay(2000);

    console.log("Extracting flight information...");
    const flights = await page.evaluate(() => {
      const flightCards = document.querySelectorAll(".trip-selector_item");
      const outboundFlights = [];
      const inboundFlights = [];

      flightCards.forEach((card, index) => {
        const departureTime = card
          .querySelector(".vy-journey_origin .vy-journey_hour")
          ?.textContent.trim();
        const arrivalTime = card
          .querySelector(".vy-journey_destination .vy-journey_hour")
          ?.textContent.trim();
        const price = card
          .querySelector(".price .priceCurrency")
          ?.textContent.trim();
        const flightNumber = card
          .querySelector(".flight-code")
          ?.textContent.trim();
        const from = card
          .querySelector(".vy-journey_origin .vy-journey-iata")
          ?.textContent.trim();
        const to = card
          .querySelector(".vy-journey_destination .vy-journey-iata")
          ?.textContent.trim();

        const flightInfo = {
          departureTime,
          arrivalTime,
          // return price as integer instead of string
          price: parseFloat(price.replace(/[^\d.-]/g, ""), 2) / 1,
          flightNumber,
          from,
          to,
        };

        if (
          index === 0 ||
          from ===
            document
              .querySelector(".vy-journey_origin .vy-journey-iata")
              .textContent.trim()
        ) {
          outboundFlights.push(flightInfo);
        } else {
          inboundFlights.push(flightInfo);
        }
      });

      return { outboundFlights, inboundFlights };
    });

    return flights;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = searchVuelingFlights;
