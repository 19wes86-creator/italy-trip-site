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

    if (day.items && day.items.length > 0) {
      day.items.forEach((item) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';

        itemCard.innerHTML = `
          <div class="item-name">${item.name || 'Untitled item'}</div>
          <div class="muted">${item.type || 'activity'}</div>
          ${item.time ? `<div><strong>Time:</strong> ${item.time}</div>` : ''}
          ${item.address ? `<div><strong>Address:</strong> ${item.address}</div>` : ''}
          ${item.notes ? `<div><strong>Notes:</strong> ${item.notes}</div>` : ''}
          ${
            item.mapsUrl
              ? `<a class="map-link" href="${item.mapsUrl}" target="_blank" rel="noreferrer">Open in Maps</a>`
              : ''
          }
        `;

        dayCard.appendChild(itemCard);
      });
    } else {
      const emptyText = document.createElement('p');
      emptyText.className = 'muted';
      emptyText.textContent = 'No items added yet for this day.';
      dayCard.appendChild(emptyText);
    }

    detailsContent.appendChild(dayCard);
  });
}

function renderAppWithData(stopsData) {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <header class="site-header">
      <h1>Italy Trip 2026</h1>
      <p class="subtitle">Trip overview and daily itinerary</p>
    </header>

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

  renderStops(stopsData);
}

async function loadCities() {
  showMessage('Loading...', 'Loading itinerary from Supabase.');

  const { data, error } = await supabase
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
    .order('order_index');

  if (error) {
    console.error('Error loading cities:', error);
    showMessage('Error loading cities', error.message || 'Unknown error');
    return;
  }

  console.log('Loaded cities:', data);

  const formattedStops = (data || []).map((city) => {
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
        items: (day.items || [])
          .slice()
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map((item) => ({
            type: item.type || '',
            name: item.name || '',
            time: item.time || '',
            address: item.address || '',
            mapsUrl: item.maps_url || '',
            notes: item.notes || '',
          })),
      }));

    return {
      city: city.name,
      startDate: city.start_date,
      endDate: city.end_date,
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
    };
  });

  if (formattedStops.length === 0) {
    showMessage('No cities found', 'Add a city row in Supabase to start building the itinerary.');
    return;
  }

  renderAppWithData(formattedStops);
}

loadCities().catch((error) => {
  console.error('Unexpected app error:', error);
  showMessage('Unexpected error', error.message || 'Something went wrong.');
}); 