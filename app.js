const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const searchButton = searchForm.querySelector('button[type="submit"]');
const statusMessage = document.querySelector("#status");
const currentCard = document.querySelector("#current");
const forecastSection = document.querySelector("#forecast");

// Muestra un mensaje con el estado visual indicado.
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`;
  statusMessage.hidden = false;
}

// Oculta y limpia el mensaje de estado.
function hideStatus() {
  statusMessage.hidden = true;
  statusMessage.textContent = "";
  statusMessage.className = "status";
}

// Consulta JSON y convierte los fallos de red y HTTP en mensajes claros.
async function fetchJSON(url) {
  if (navigator.onLine === false) {
    throw new Error("Sin conexión a internet. Revisa tu red e inténtalo de nuevo");
  }

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    if (error instanceof TypeError || navigator.onLine === false) {
      throw new Error("Sin conexión a internet. Revisa tu red e inténtalo de nuevo");
    }

    throw error;
  }

  if (response.status === 429) {
    throw new Error("Demasiadas peticiones. Espera un momento e inténtalo de nuevo");
  }

  if (!response.ok) {
    throw new Error(
      `El servicio no está disponible (error ${response.status}). Inténtalo más tarde`,
    );
  }

  return response.json();
}

// Busca las coordenadas de una ciudad.
async function getCoordinates(city) {
  const params = new URLSearchParams({
    name: city,
    count: "1",
    language: "es",
  });
  const data = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  const place = data.results?.[0];

  if (!place) {
    throw new Error(`No se encontró la ciudad "${city}"`);
  }

  return place;
}

// Obtiene las condiciones actuales para unas coordenadas.
async function getWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "7",
    timezone: "auto",
  });
  const data = await fetchJSON(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!data.current || !data.daily) {
    throw new Error("No hay datos del clima disponibles.");
  }

  return data;
}

// Devuelve el emoji asociado al código meteorológico de Open-Meteo.
function getWeatherEmoji(code) {
  if (code === 0) {
    return "☀️";
  } else if (code >= 1 && code <= 3) {
    return "☁️";
  } else if (code >= 45 && code <= 48) {
    return "🌫️";
  } else if (code >= 51 && code <= 67) {
    return "🌧️";
  } else if (code >= 71 && code <= 77) {
    return "❄️";
  } else if (code >= 80 && code <= 82) {
    return "🌦️";
  } else if (code >= 95 && code <= 99) {
    return "⛈️";
  }

  return "🌡️";
}

// Presenta las condiciones actuales y su icono.
function renderCurrent(place, data) {
  const current = data.current;

  const title = document.createElement("h2");
  title.textContent = `${getWeatherEmoji(current.weather_code)} ${place.name}, ${place.country}`;

  const temperature = document.createElement("p");
  temperature.textContent = `Temperatura: ${current.temperature_2m} °C`;

  const humidity = document.createElement("p");
  humidity.textContent = `Humedad: ${current.relative_humidity_2m}%`;

  const wind = document.createElement("p");
  wind.textContent = `Viento: ${current.wind_speed_10m} km/h`;

  currentCard.replaceChildren(title, temperature, humidity, wind);
  currentCard.hidden = false;
  forecastSection.hidden = true;
}

// Dibuja una tarjeta por cada día del pronóstico.
function renderForecast(daily) {
  const cards = daily.time.map((date, index) => {
    const card = document.createElement("article");
    const day = document.createElement("h3");
    const icon = document.createElement("p");
    const temperatures = document.createElement("p");

    day.textContent = new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
      weekday: "short",
    });
    icon.textContent = getWeatherEmoji(daily.weather_code[index]);
    icon.setAttribute("aria-label", "Estado del clima");
    temperatures.textContent =
      `${Math.round(daily.temperature_2m_max[index])}° / ` +
      `${Math.round(daily.temperature_2m_min[index])}°`;

    card.append(day, icon, temperatures);
    return card;
  });

  forecastSection.replaceChildren(...cards);
  forecastSection.hidden = false;
}

// Busca la ciudad y muestra su clima actual.
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    currentCard.hidden = true;
    forecastSection.hidden = true;
    showStatus("Escribe el nombre de una ciudad", "error");
    return;
  }

  searchButton.disabled = true;
  showStatus("Buscando...", "loading");
  try {
    const place = await getCoordinates(city);
    const weather = await getWeather(place.latitude, place.longitude);
    renderCurrent(place, weather);
    renderForecast(weather.daily);

    hideStatus();
  } catch (error) {
    currentCard.hidden = true;
    forecastSection.hidden = true;
    showStatus(error.message, "error");
  } finally {
    searchButton.disabled = false;

    if (statusMessage.classList.contains("loading")) {
      hideStatus();
    }
  }
});