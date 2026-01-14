const sidebar = document.querySelector('.sidebar');
const sidebarIcon = document.querySelector('.sidebar-icon');
let sidebarOpen = false;

// Prüfe ob Touch-Device
const isTouchDevice = () => {
  return (('ontouchstart' in window) ||
          (navigator.maxTouchPoints > 0) ||
          (navigator.msMaxTouchPoints > 0));
};

// Sidebar Toggle Funktion
const toggleSidebar = () => {
  sidebarOpen = !sidebarOpen;
  if (sidebarOpen) {
    sidebar.classList.add('active');
  } else {
    sidebar.classList.remove('active');
  }
};

// Icon Click zum Ausfahren (funktioniert auf Mobile und Desktop)
sidebarIcon.addEventListener('click', toggleSidebar);

// Bei Desktop: Hover-Funktionalität zusätzlich
if (!isTouchDevice()) {
  sidebar.addEventListener('mouseenter', () => {
    sidebar.classList.add('active');
    sidebarOpen = true;
  });
  
  sidebar.addEventListener('mouseleave', () => {
    sidebar.classList.remove('active');
    sidebarOpen = false;
  });
}

// Seiten laden
const loadPage = (page) => {
  const content = document.getElementById('content');
  
  if (page === 'home') {
    content.innerHTML = '<h1>Willkommen!</h1>';
  } else if (page === 'weather') {
    content.innerHTML = '<div id="weather-container"></div>';
    getWeather('Berlin');
  }
};

const getWeather = async (city) => {
  const cities = {
    'Braunschweig': { lat: 52.2688, lon: 10.5267 },
    'Berlin': { lat: 52.52, lon: 13.41 },
    'München': { lat: 48.1351, lon: 11.5820 }
  };
  
  const coords = cities[city] || cities['Braunschweig'];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe/Berlin`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const temp = data.current.temperature_2m;
    const windSpeed = data.current.wind_speed_10m;
    
    document.getElementById('weather-container').innerHTML = `
      <h1>🌤️ Wetter in ${city}</h1>
      <p><strong>Temperatur:</strong> ${temp}°C</p>
      <p><strong>Windgeschwindigkeit:</strong> ${windSpeed} km/h</p>
    `;
  } catch (error) {
    console.error('Fehler beim Abrufen des Wetters:', error);
  }
};

// Home-Seite beim Start laden
loadPage('home');
