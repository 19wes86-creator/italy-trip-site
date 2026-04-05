async function loadTripData() {
  const response = await fetch("trip-data.json");
  const data = await response.json();

  document.getElementById("trip-title").textContent = data.tripTitle;

  renderStops(data.stops);
}

function renderStops(stops) {
  const stopsList = document.getElementById("stops-list");
  stopsList.innerHTML = "";

  stops.forEach((stop, index) => {
    const card = document.createElement("div");
    card.className = "stop-card";

    const button = document.createElement("button");
    button.innerHTML = `
      <div class="stop-city">${stop.city}</div>
      <div class="stop-dates">${stop.startDate} to ${stop.endDate}</div>
    `;

    button.addEventListener("click", () => {
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
  const detailsTitle = document.getElementById("details-title");
  const detailsContent = document.getElementById("details-content");

  detailsTitle.textContent = stop.city;
  detailsContent.innerHTML = "";

  const stayBox = document.createElement("div");
  stayBox.className = "stay-box";

  stayBox.innerHTML = `
    <h3>Stay</h3>
    <p><strong>Name:</strong> ${stop.stay?.name || "Not added yet"}</p>
    <p><strong>Address:</strong> ${stop.stay?.address || "Not added yet"}</p>
    ${
      stop.stay?.mapsUrl
        ? `<a class="map-link" href="${stop.stay.mapsUrl}" target="_blank">Get directions</a>`
        : `<p class="muted">No directions link added yet.</p>`
    }
  `;

  detailsContent.appendChild(stayBox);

  if (!stop.days || stop.days.length === 0) {
    detailsContent.innerHTML += "<p>No daily itinerary added yet.</p>";
    return;
  }

  stop.days.forEach((day) => {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";

    dayCard.innerHTML = `
      <div class="day-header">
        <div class="day-date">${day.date}</div>
        <div class="day-title">${day.title || ""}</div>
      </div>
    `;

    if (day.items && day.items.length > 0) {
      day.items.forEach((item) => {
        const itemCard = document.createElement("div");
        itemCard.className = "item-card";

        itemCard.innerHTML = `
          <div class="item-name">${item.name || "Untitled item"}</div>
          <div class="muted">${item.type || "activity"}</div>
          ${item.time ? `<div><strong>Time:</strong> ${item.time}</div>` : ""}
          ${item.address ? `<div><strong>Address:</strong> ${item.address}</div>` : ""}
          ${item.notes ? `<div><strong>Notes:</strong> ${item.notes}</div>` : ""}
          ${
            item.mapsUrl
              ? `<a class="map-link" href="${item.mapsUrl}" target="_blank">Open in Maps</a>`
              : ""
          }
        `;

        dayCard.appendChild(itemCard);
      });
    } else {
      const emptyText = document.createElement("p");
      emptyText.className = "muted";
      emptyText.textContent = "No items added yet for this day.";
      dayCard.appendChild(emptyText);
    }

    detailsContent.appendChild(dayCard);
  });
}

loadTripData().catch((error) => {
  console.error("Failed to load trip data:", error);
  document.getElementById("details-content").innerHTML =
    "<p>Could not load trip data. Make sure you're running this from a local server.</p>";
});