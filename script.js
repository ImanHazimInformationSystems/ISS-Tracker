// Replace with your deployed Google Apps Script Web App URL
const apiUrl = "YOUR_GOOGLE_APPS_SCRIPT_URL";

// Maximum points to display in charts
const MAX_POINTS = 50;

// Arrays to store last N points
let latData = [];
let lonData = [];
let altData = [];
let timeLabels = [];

// Initialize Leaflet map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
const issMarker = L.marker([0,0]).addTo(map);

// Initialize Charts
const latChart = new Chart(document.getElementById('latChart'), {
  type: 'line',
  data: { labels: timeLabels, datasets: [{ label: 'Latitude', data: latData, borderColor: 'red', fill: false }] },
  options: { responsive: true }
});
const lonChart = new Chart(document.getElementById('lonChart'), {
  type: 'line',
  data: { labels: timeLabels, datasets: [{ label: 'Longitude', data: lonData, borderColor: 'blue', fill: false }] },
  options: { responsive: true }
});
const altChart = new Chart(document.getElementById('altChart'), {
  type: 'line',
  data: { labels: timeLabels, datasets: [{ label: 'Altitude (km)', data: altData, borderColor: 'green', fill: false }] },
  options: { responsive: true }
});

// Fetch ISS data from Google Sheets via Apps Script
async function fetchISSData() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.length === 0) return;

    const latest = data[data.length - 1];
    document.getElementById('lat').innerText = latest.latitude.toFixed(3);
    document.getElementById('lon').innerText = latest.longitude.toFixed(3);
    document.getElementById('alt').innerText = latest.altitude.toFixed(1);
    document.getElementById('vel').innerText = latest.velocity.toFixed(0);

    // Update map
    const lat = latest.latitude;
    const lon = latest.longitude;
    issMarker.setLatLng([lat, lon]);
    map.setView([lat, lon], map.getZoom());

    // Update charts
    const timestamp = new Date(latest.timestamp * 1000).toLocaleTimeString();
    timeLabels.push(timestamp);
    latData.push(lat);
    lonData.push(lon);
    altData.push(latest.altitude);

    if (timeLabels.length > MAX_POINTS) {
      timeLabels.shift();
      latData.shift();
      lonData.shift();
      altData.shift();
    }

    latChart.update();
    lonChart.update();
    altChart.update();

  } catch (error) {
    console.error("Error fetching ISS data:", error);
  }
}

// Fetch data every 10 seconds
fetchISSData();
setInterval(fetchISSData, 10000);
