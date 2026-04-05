import './style.css';
import { supabase } from './lib/supabase';

function showMessage(title, message) {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <header class="site-header">
      <h1>Italy Trip 2026</h1>
      <p class="subtitle">Trip overview and daily itinerary</p>
    </header>

    <main class="layout">
      <section class="panel right-panel">
        <h2>${title}</h2>
        <p>${message}</p>
      </section>
    </main>
  `;
}

function buildGoogleMapsSearchUrl(query) {
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/* ------------------- FLIGHTS ------------------- */

function renderFlights(flights) {
  const flightsContainer = document.getElementById('flights-list');
  if (!flightsContainer) return;

  flightsContainer.innerHTML = '';

  if (!flights || flights.length === 0) {
    flightsContainer.innerHTML = '<p class="muted">No flights added yet.</p>';
    return;
  }

  flights.forEach((flight) => {
    const card = document.createElement('div');
    card.className = 'flight-card';

    card.innerHTML = `
      <div class="flight-header">
        <strong>${flight.airline} ${flight.flight_number}</strong>
      </div>
      <div>${flight.departure_airport} → ${flight.arrival_airport}</div>
      <div class="muted">${flight.travel_date}</div>

      <div><strong>Depart:</strong> ${flight.departure_time || '-'}</div>
      <div><strong>Arrive:</strong> ${flight.arrival_time || '-'}</div>
      <div><strong>Confirmation:</strong> ${flight.confirmation_code || '-'}</div>

      ${
        flight.tracker_url
          ? `<a class="map-link" href="${flight.tracker_url}" target="_blank" rel="noreferrer">Track Flight</a>`
          : ''
      }
      ${
        flight.booking_url
          ? `<a class="map-link" href="${flight.booking_url}" target="_blank" rel="noreferrer">Manage Booking</a>`
          : ''
      }
      ${
        flight.check_in_url
          ? `<a class="map-link" href="${flight.check_in_url}" target="_blank" rel="noreferrer">Check In</a>`
          : ''
      }
    `;

    flightsContainer.appendChild(card);
  });
}

/* ------------------- STOPS ------------------- */

function renderStops(stopsListData) {
  const stopsList = document.getElementById('stops-list');
  if (!stopsList) return;

  stopsList.innerHTML = '';

  stopsListData.forEach((stop, index) => {
    const card = document.createElement('div');
    card.className = 'stop-card';

    const button = document.createElement('button');
    button.innerHTML = `
      <div class="stop-city">${stop.city}</div>
      <div class="stop-dates">${stop.startDate} to ${stop.endDate}</div>
    `;

    button.addEventListener('click', () => {
      renderStopDetails(stop);
    });

    card.appendChild(button);
    stopsList.appendChild(card);

    if (index === 0) {
      renderStopDetails(stop);
    }
  });
}

function renderTravelLeg(leg) {
  if (!leg) {
    return `
      <div class="travel-leg-box">
        <h3>Next Stop</h3>
        <p class="muted">No travel guidance added yet for the next leg.</p>
      </div>
    `;
  }

  const departureMapUrl = buildGoogleMapsSearchUrl(leg.departureStation);
  const arrivalMapUrl = buildGoogleMapsSearchUrl(leg.arrivalStation);

  return `
    <div class="travel-leg-box">
      <h3>Next Stop: ${leg.toCityName || 'Next destination'}</h3>
      <p>${leg.routeSummary || 'Travel details coming soon.'}</p>

      <p><strong>Mode:</strong> ${leg.mode || '-'}</p>
      <p><strong>Operator:</strong> ${leg.operator || '-'}</p>
      <p><strong>Duration:</strong> ${leg.durationText || '-'}</p>

      <p><strong>From:</strong> ${leg.departureStation || '-'}</p>
      ${
        departureMapUrl
          ? `<a class="map-link" href="${departureMapUrl}" target="_blank" rel="noreferrer">Directions to departure point</a>`
          : ''
      }

      <p><strong>To:</strong> ${leg.arrivalStation || '-'}</p>
      ${
        arrivalMapUrl
          ? `<a class="map-link" href="${arrivalMapUrl}" target="_blank" rel="noreferrer">View arrival point</a>`
          : ''
      }

      ${
        leg.bookingUrl
          ? `<a class="map-link" href="${leg.bookingUrl}" target="_blank" rel="noreferrer">Book / Check Schedules</a>`
          : ''
      }
      ${
        leg.backupBookingUrl
          ? `<a class="map-link" href="${leg.backupBookingUrl}" target="_blank" rel="noreferrer">Backup Booking Option</a>`
          : ''
      }

      ${
        leg.notes
          ? `<p><strong>Notes:</strong> ${leg.notes}</p>`
          : ''
      }
    </div>
  `;
}

function renderStopDetails(stop) {
  const detailsTitle = document.getElementById('details-title');
  const detailsContent = document.getElementById('details-content');

  if (!detailsTitle || !detailsContent) return;

  detailsTitle.textContent = stop.city;
  detailsContent.innerHTML = '';

  if (stop.imageUrl) {
    const imageBox = document.createElement('div');
    imageBox.className = 'city-image-box';
    imageBox.innerHTML = `
      <img class="city-image" src="${stop.imageUrl}" alt="${stop.city}" />
    `;
    detailsContent.appendChild(imageBox);
  }

  const stayBox = document.createElement('div');
  stayBox.className = 'stay-box';

  stayBox.innerHTML = `
    <h3>Stay</h3>
    <p><strong>Name:</strong> ${stop.stay?.name || 'Not added yet'}</p>
    <p><strong>Address:</strong> ${stop.stay?.address || 'Not added yet'}</p>
    ${
      stop.stay?.mapsUrl
        ? `<a class="map-link" href="${stop.stay.mapsUrl}" target="_blank" rel="noreferrer">Get directions</a>`
        : `<p class="muted">No directions link added yet.</p>`
    }
    ${
      stop.stay?.bookingUrl
        ? `<a class="map-link" href="${stop.stay.bookingUrl}" target="_blank" rel="noreferrer">Open booking</a>`
        : `<p class="muted">No booking link added yet.</p>`
    }
  `;

  detailsContent.appendChild(stayBox);

  if (!stop.days || stop.days.length === 0) {
    detailsContent.innerHTML += '<p>No daily itinerary added yet.</p>';
  } else {
    stop.days.forEach((day) => {
      const dayCard = document.createElement('div');
      dayCard.className = 'day-card';

      dayCard.innerHTML = `
        <div class="day-header">
          <div class="day-date">${day.date}</div>
          <div class="day-title">${day.title || ''}</div>
        </div>
      `;

      detailsContent.appendChild(dayCard);
    });
  }

  detailsContent.insertAdjacentHTML('beforeend', renderTravelLeg(stop.travelLeg));
}

/* ------------------- APP ------------------- */

function renderAppWithData(stopsData, flightsData) {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <header class="site-header">
      <h1>Italy Trip 2026</h1>
      <p class="subtitle">Trip overview and daily itinerary</p>
    </header>

    <section class="panel flights-panel">
      <h2>Flights</h2>
      <div id="flights-list"></div>
    </section>

    <main class="layout">
      <section class="panel left-panel">
        <h2>Stops</h2>
        <div id="stops-list" class="card-list"></div>
      </section>

      <section class="panel right-panel">
        <h2 id="details-title">Details</h2>
        <div id="details-content">
          <p>Select a stop to view the itinerary.</p>
        </div>
      </section>
    </main>
  `;

  renderFlights(flightsData);
  renderStops(stopsData);
}

/* ------------------- LOAD DATA ------------------- */

async function loadData() {
  showMessage('Loading...', 'Loading itinerary from Supabase.');

  const [citiesRes, flightsRes, legsRes] = await Promise.all([
    supabase
      .from('cities')
      .select(`
        id,
        name,
        start_date,
        end_date,
        order_index,
        image_url,
        stays!stays_city_id_fkey (
          name,
          address,
          maps_url,
          booking_url
        ),
        days (
          id,
          date,
          title,
          order_index,
          items!items_day_id_fkey (
            type,
            name,
            time,
            address,
            maps_url,
            notes,
            order_index
          )
        )
      `)
      .order('order_index'),

    supabase
      .from('flights')
      .select('*')
      .order('order_index'),

    supabase
      .from('travel_legs')
      .select(`
        id,
        from_city_id,
        to_city_id,
        travel_date,
        mode,
        operator,
        route_summary,
        departure_station,
        arrival_station,
        duration_text,
        booking_url,
        backup_booking_url,
        notes,
        order_index
      `)
      .order('order_index'),
  ]);

  if (citiesRes.error) {
    showMessage('Error loading cities', citiesRes.error.message);
    return;
  }

  if (flightsRes.error) {
    showMessage('Error loading flights', flightsRes.error.message);
    return;
  }

  if (legsRes.error) {
    showMessage('Error loading travel legs', legsRes.error.message);
    return;
  }

  const cities = citiesRes.data || [];
  const travelLegs = legsRes.data || [];
  const cityNameById = Object.fromEntries(cities.map((city) => [city.id, city.name]));

  const legByFromCityId = Object.fromEntries(
    travelLegs.map((leg) => [
      leg.from_city_id,
      {
        mode: leg.mode || '',
        operator: leg.operator || '',
        routeSummary: leg.route_summary || '',
        departureStation: leg.departure_station || '',
        arrivalStation: leg.arrival_station || '',
        durationText: leg.duration_text || '',
        bookingUrl: leg.booking_url || '',
        backupBookingUrl: leg.backup_booking_url || '',
        notes: leg.notes || '',
        travelDate: leg.travel_date || '',
        toCityName: cityNameById[leg.to_city_id] || '',
      },
    ])
  );

  const formattedStops = cities.map((city) => {
    const firstStay = Array.isArray(city.stays)
      ? city.stays[0]
      : city.stays || null;

    const sortedDays = (city.days || [])
      .slice()
      .sort((a, b) => {
        const orderDiff = (a.order_index || 0) - (b.order_index || 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(a.date) - new Date(b.date);
      })
      .map((day) => ({
        date: day.date,
        title: day.title || '',
      }));

    return {
      city: city.name,
      startDate: city.start_date,
      endDate: city.end_date,
      imageUrl: city.image_url || '',
      stay: firstStay
        ? {
            name: firstStay.name || '',
            address: firstStay.address || '',
            mapsUrl: firstStay.maps_url || '',
            bookingUrl: firstStay.booking_url || '',
          }
        : {
            name: '',
            address: '',
            mapsUrl: '',
            bookingUrl: '',
          },
      days: sortedDays,
      travelLeg: legByFromCityId[city.id] || null,
    };
  });

  if (formattedStops.length === 0) {
    showMessage('No cities found', 'Add a city row in Supabase to start building the itinerary.');
    return;
  }

  renderAppWithData(formattedStops, flightsRes.data || []);
}

loadData().catch((error) => {
  console.error('Unexpected app error:', error);
  showMessage('Unexpected error', error.message || 'Something went wrong.');
});
