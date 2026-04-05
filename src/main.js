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
          ? `<a class="map-link" href="${flight.tracker_url}" target="_blank">Track Flight</a>`
          : ''
      }
      ${
        flight.booking_url
          ? `<a class="map-link" href="${flight.booking_url}" target="_blank">Manage Booking</a>`
          : ''
      }
      ${
        flight.check_in_url
          ? `<a class="map-link" href="${flight.check_in_url}" target="_blank">Check In</a>`
          : ''
      }
    `;

    flightsContainer.appendChild(card);
  });
}

/* ------------------- STOPS ------------------- */

function renderStops(stopsListData) {
  const stopsList = document.getElementById('stops-list');
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

function renderStopDetails(stop) {
  const detailsTitle = document.getElementById('details-title');
  const detailsContent = document.getElementById('details-content');

  detailsTitle.textContent = stop.city;
  detailsContent.innerHTML = '';

  const stayBox = document.createElement('div');
  stayBox.className = 'stay-box';

  stayBox.innerHTML = `
    <h3>Stay</h3>
    <p><strong>Name:</strong> ${stop.stay?.name || 'Not added yet'}</p>
    <p><strong>Address:</strong> ${stop.stay?.address || 'Not added yet'}</p>
  `;

  detailsContent.appendChild(stayBox);

  if (!stop.days || stop.days.length === 0) {
    detailsContent.innerHTML += '<p>No daily itinerary added yet.</p>';
    return;
  }

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

/* ------------------- APP ------------------- */

function renderAppWithData(stopsData, flightsData) {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <header class="site-header">
      <h1>Italy Trip 2026</h1>
      <p class="subtitle">Trip overview and daily itinerary</p>
    </header>

    <main class="layout">

      <section class="panel full-panel">
        <h2>Flights</h2>
        <div id="flights-list"></div>
      </section>

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

  const [citiesRes, flightsRes] = await Promise.all([
    supabase
      .from('cities')
      .select(`
        id,
        name,
        start_date,
        end_date,
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
  ]);

  if (citiesRes.error) {
    showMessage('Error loading cities', citiesRes.error.message);
    return;
  }

  if (flightsRes.error) {
    showMessage('Error loading flights', flightsRes.error.message);
    return;
  }

  const formattedStops = (citiesRes.data || []).map((city) => {
    const firstStay = Array.isArray(city.stays)
      ? city.stays[0]
      : city.stays || null;

    return {
      city: city.name,
      startDate: city.start_date,
      endDate: city.end_date,
      stay: firstStay
        ? {
            name: firstStay.name || '',
            address: firstStay.address || '',
          }
        : {},
      days: (city.days || []).map((d) => ({
        date: d.date,
        title: d.title,
      })),
    };
  });

  renderAppWithData(formattedStops, flightsRes.data || []);
}

loadData();