// Global variables
let map;
let geoData = null;
const errorsEl = document.getElementById('errors');

// Error handling function
function showError(msg) {
  console.error(msg);
  errorsEl.textContent = msg;
  errorsEl.style.display = 'block';
  setTimeout(() => {
    errorsEl.style.display = 'none';
  }, 5000);
}

// Initialize the application
function initApp() {
  initializeMap();
  setupEventListeners();
  loadGeoData();
}

// Initialize Leaflet map
function initializeMap() {
  map = L.map('map', {
    minZoom: 2,
    maxZoom: 8,
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
  }).setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Add click event listener to map
  map.on("click", handleMapClick);
}

// Setup all event listeners
function setupEventListeners() {
  const irrigationInput = document.getElementById('irrigation');
  const fertInput = document.getElementById('fert');
  const runSimBtn = document.getElementById('runSim');
  const resetBtn = document.getElementById('reset');

  // Range input events
  irrigationInput.addEventListener('input', updateIrrigationValue);
  fertInput.addEventListener('input', updateFertilizerValue);
  
  // Button events
  runSimBtn.addEventListener('click', runSimulation);
  resetBtn.addEventListener('click', resetForm);
}

// Load geographical data
function loadGeoData() {
  fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      geoData = data;
      L.geoJSON(data, {
        style: {
          color: "#3388ff",
          weight: 1,
          fillOpacity: 0.05
        }
      }).addTo(map);
      log("Геодані завантажено успішно");
    })
    .catch(err => {
      showError("Помилка завантаження геоданих: " + err.message);
    });
}

// Handle map click events
function handleMapClick(e) {
  if (!geoData) {
    showError("Геодані ще не завантажені");
    return;
  }

  const clickedFeature = geoData.features.find(f => 
    turf.booleanPointInPolygon([e.latlng.lng, e.latlng.lat], f)
  );

  if (clickedFeature) {
    const name = clickedFeature.properties?.ADMIN || clickedFeature.properties?.name || "Невідомо";
    updateSelectedCountry(name);
    simulateDataLoading(name);
  } else {
    updateSelectedCountry(null);
  }
}

// Update selected country display
function updateSelectedCountry(countryName) {
  const coordsElement = document.getElementById('coords');
  if (countryName) {
    coordsElement.textContent = "🌍 " + countryName;
    log("Обрана країна: " + countryName);
  } else {
    coordsElement.textContent = "Океан або невизначена зона";
    log("Обрано океанічну зону - дані недоступні");
  }
}

// Simulate data loading for selected country
function simulateDataLoading(countryName) {
  setTimeout(() => {
    document.getElementById('dataSummary').textContent = 
      `Дані для ${countryName}: температура 15-28°C, опади 45-120мм`;
    log("Дані NASA завантажено для " + countryName);
  }, 800);
}

// Update irrigation value display
function updateIrrigationValue() {
  const irrigationInput = document.getElementById('irrigation');
  const irrigationOut = document.getElementById('irrigationOut');
  irrigationOut.textContent = irrigationInput.value;
}

// Update fertilizer value display
function updateFertilizerValue() {
  const fertInput = document.getElementById('fert');
  const fertOut = document.getElementById('fertOut');
  fertOut.textContent = fertInput.value;
}

// Run simulation
function runSimulation() {
  const country = document.getElementById('coords').textContent.replace('🌍 ', '');
  if (country === 'Натисніть на карту для вибору') {
    showError("Будь ласка, спочатку оберіть країну на карті");
    return;
  }
  
  const crop = document.getElementById('cropSelect').value;
  const irrigation = document.getElementById('irrigation').value;
  const fertilizer = document.getElementById('fert').value;
  
  log(`Запуск симуляції для ${country}, культура: ${getCropName(crop)}`);
  log(`Полив: ${irrigation} л/м², Добрива: ${fertilizer} од/га`);
  
  // Simulate processing
  setTimeout(() => {
    const results = calculateResults(irrigation, fertilizer);
    displayResults(results);
    log(`Симуляція завершена. Оцінка: ${results.score}`);
  }, 1500);
}

// Get crop name in Ukrainian
function getCropName(cropValue) {
  const crops = {
    'maize': 'Кукурудза',
    'wheat': 'Пшениця',
    'soy': 'Соя',
    'sorghum': 'Сорго'
  };
  return crops[cropValue] || cropValue;
}

// Calculate simulation results
function calculateResults(irrigation, fertilizer) {
  const irrigationNum = parseFloat(irrigation);
  const fertilizerNum = parseFloat(fertilizer);
  
  return {
    yield: (Math.random() * 10 + 5).toFixed(1) + " т/га",
    water: (irrigationNum * 15 + Math.random() * 20).toFixed(0) + " м³",
    eco: fertilizerNum > 100 ? "Високий" : fertilizerNum > 50 ? "Помірний" : "Низький",
    score: Math.floor(100 - (fertilizerNum / 2) + (irrigationNum * 3) + Math.random() * 20)
  };
}

// Display results in UI
function displayResults(results) {
  document.getElementById('yieldVal').textContent = results.yield;
  document.getElementById('waterVal').textContent = results.water;
  document.getElementById('ecoVal').textContent = results.eco;
  document.getElementById('scoreVal').textContent = results.score;
}

// Reset form to initial state
function resetForm() {
  document.getElementById('irrigation').value = 3;
  document.getElementById('irrigationOut').textContent = '3';
  document.getElementById('fert').value = 80;
  document.getElementById('fertOut').textContent = '80';
  document.getElementById('cropSelect').value = 'maize';
  document.getElementById('coords').textContent = 'Натисніть на карту для вибору';
  document.getElementById('dataSummary').textContent = 'Немає даних для обраної області';
  
  // Reset results
  document.getElementById('yieldVal').textContent = '—';
  document.getElementById('waterVal').textContent = '—';
  document.getElementById('ecoVal').textContent = '—';
  document.getElementById('scoreVal').textContent = '—';
  
  log('Параметри скинуто до початкових значень');
}

// Log function for activity tracking
function log(text) {
  const logEl = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="log-time">[${time}]</span> ${text}`;
  logEl.prepend(entry);
  
  // Limit log entries to 10
  if (logEl.children.length > 10) {
    logEl.removeChild(logEl.lastChild);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);