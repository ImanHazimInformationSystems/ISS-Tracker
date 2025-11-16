const API_URL = "https://api.wheretheiss.at/v1/satellites/25544";

let map = L.map("map").setView([0, 0], 2);

// Map tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 7,
}).addTo(map);

// ISS icon
let issIcon = L.icon({
  iconUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg",
  iconSize: [50, 32],
});

let issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);

// CSV data store with headers
let csvData = [["Time", "Latitude", "Longitude", "Altitude_km", "Velocity_kmh"]];

// Chart.js setup
let ctx = document.getElementById("altitudeChart").getContext("2d");

let altitudeChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "ISS Altitude (km)",
        data: [],
        borderWidth: 2,
        fill: false,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: "Time" } },
      y: { title: { display: true, text: "Altitude (km)" } },
    },
  },
});

async function fetchISS() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    let lat = data.latitude.toFixed(4);
    let lon = data.longitude.toFixed(4);
    let alt = data.altitude.toFixed(2);
    let vel = data.velocity.toFixed(2);

    // Format timestamp to 24hr + date
    let ts = new Date(data.timestamp * 1000);
    let formattedTime =
      ts.getFullYear() + "-" +
      String(ts.getMonth() + 1).padStart(2, '0') + "-" +
      String(ts.getDate()).padStart(2, '0') + " " +
      String(ts.getHours()).padStart(2, '0') + ":" +
      String(ts.getMinutes()).padStart(2, '0') + ":" +
      String(ts.getSeconds()).padStart(2, '0');

    // Update UI
    document.getElementById("lat").textContent = lat;
    document.getElementById("lon").textContent = lon;
    document.getElementById("alt").textContent = alt;
    document.getElementById("vel").textContent = vel;
    document.getElementById("time").textContent = formattedTime;

    // Update map
    issMarker.setLatLng([lat, lon]);
    map.setView([lat, lon]);

    // Add to CSV
    csvData.push([formattedTime, lat, lon, alt, vel]);

    // Send data to Google Sheets
    fetch("https://script.google.com/macros/s/AKfycbx9ozQKit8YNCm4UTd6bfXiYT9pJ8RzcQwyKRi9UmVbz6BFpaL-fEW3GaGb_-vBCQfPvg/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: formattedTime, // send human-readable
        latitude: lat,
        longitude: lon,
        altitude: alt,
        velocity: vel
      })
    })
    .then(res => res.text())
    .then(result => console.log("Sheet response:", result))
    .catch(err => console.error("Error sending to sheet:", err));

    // Update chart
    altitudeChart.data.labels.push(formattedTime);
    altitudeChart.data.datasets[0].data.push(alt);
    altitudeChart.update();

  } catch (e) {
    console.error("API error:", e);
  }
}

// Auto-update every 5 seconds
setInterval(fetchISS, 5000);
fetchISS();

// Download CSV
document.getElementById("downloadCsvBtn").addEventListener("click", () => {
  let csvContent = "data:text/csv;charset=utf-8," 
    + csvData.map(e => e.join(",")).join("\n");

  const a = document.createElement("a");
  a.href = encodeURI(csvContent);
  a.download = "iss_data.csv";
  a.click();
});
