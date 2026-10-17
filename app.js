const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const searchButton = searchForm.querySelector('button[type="submit"]');
const statusMessage = document.querySelector("#status");
const currentCard = document.querySelector("#current");
const forecastSection = document.querySelector("#forecast");
const suggestionsList = document.querySelector("#city-suggestions");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");
const themeLabel = document.querySelector("#theme-label");
let suggestionTimer;
let suggestionController;
let activeSuggestionIndex = -1;
let selectedPlace = null;

// Cambia el tema y actualiza el nombre accesible del botón.
function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    `Cambiar a modo ${isDark ? "claro" : "oscuro"}`,
  );
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeLabel.textContent = `Modo ${isDark ? "claro" : "oscuro"}`;
}

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
async function fetchJSON(url, options = {}) {
  if (navigator.onLine === false) {
    throw new Error("Sin conexión a internet. Revisa tu red e inténtalo de nuevo");
  }

  let response;
  try {
    response = await fetch(url, options);
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

// Construye el texto de una ciudad para mostrarla en las sugerencias.
function getPlaceLabel(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

// Oculta la lista y restablece el estado accesible del combobox.
function hideSuggestions() {
  suggestionsList.replaceChildren();
  suggestionsList.hidden = true;
  cityInput.setAttribute("aria-expanded", "false");
  cityInput.removeAttribute("aria-activedescendant");
  activeSuggestionIndex = -1;
}

// Selecciona una ciudad y busca su clima usando las coordenadas sugeridas.
function chooseSuggestion(place) {
  cityInput.value = getPlaceLabel(place);
  selectedPlace = { ...place, label: cityInput.value };
  hideSuggestions();
  searchForm.requestSubmit();
}

// Consulta y muestra sugerencias después de una breve pausa al escribir.
async function loadSuggestions(query, signal) {
  const params = new URLSearchParams({
    name: query,
    count: "5",
    language: "es",
  });

  try {
    const data = await fetchJSON(
      `https://geocoding-api.open-meteo.com/v1/search?${params}`,
      { signal },
    );

    if (cityInput.value.trim() !== query || signal.aborted) {
      return;
    }

    const places = data.results ?? [];
    if (places.length === 0) {
      hideSuggestions();
      return;
    }

    const options = places.map((place, index) => {
      const option = document.createElement("button");
      option.id = `city-suggestion-${index}`;
      option.type = "button";
      option.className = "suggestion-option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.textContent = getPlaceLabel(place);
      option.addEventListener("mousedown", (event) => event.preventDefault());
      option.addEventListener("click", () => chooseSuggestion(place));
      return option;
    });

    suggestionsList.replaceChildren(...options);
    suggestionsList.hidden = false;
    cityInput.setAttribute("aria-expanded", "true");
  } catch (error) {
    if (error.name !== "AbortError" && cityInput.value.trim() === query) {
      hideSuggestions();
      showStatus(error.message, "error");
    }
  }
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

  clearTimeout(suggestionTimer);
  suggestionController?.abort();
  hideSuggestions();

  if (!city) {
    selectedPlace = null;
    currentCard.hidden = true;
    forecastSection.hidden = true;
    showStatus("Escribe el nombre de una ciudad", "error");
    return;
  }

  searchButton.disabled = true;
  showStatus("Buscando...", "loading");
  try {
    const place = selectedPlace?.label === city
      ? selectedPlace
      : await getCoordinates(city);
    selectedPlace = null;
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

cityInput.addEventListener("input", () => {
  selectedPlace = null;
  clearTimeout(suggestionTimer);
  suggestionController?.abort();
  hideSuggestions();

  if (statusMessage.classList.contains("error")) {
    hideStatus();
  }

  const query = cityInput.value.trim();
  if (query.length < 2) {
    return;
  }

  suggestionTimer = setTimeout(() => {
    suggestionController = new AbortController();
    loadSuggestions(query, suggestionController.signal);
  }, 300);
});

cityInput.addEventListener("keydown", (event) => {
  const options = [...suggestionsList.querySelectorAll('[role="option"]')];
  if (options.length === 0) {
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    activeSuggestionIndex =
      (activeSuggestionIndex + direction + options.length) % options.length;

    options.forEach((option, index) => {
      const isActive = index === activeSuggestionIndex;
      option.setAttribute("aria-selected", String(isActive));
      if (isActive) {
        cityInput.setAttribute("aria-activedescendant", option.id);
      }
    });
  } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
    event.preventDefault();
    options[activeSuggestionIndex].click();
  } else if (event.key === "Escape") {
    hideSuggestions();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-area")) {
    clearTimeout(suggestionTimer);
    suggestionController?.abort();
    hideSuggestions();
  }
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

setTheme("light");