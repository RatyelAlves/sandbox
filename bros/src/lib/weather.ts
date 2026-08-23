export const CLIMA_CITY_KEY = "clima_cidade";

export type DailyForecast = {
  date: string;
  min: number;
  max: number;
  condition: string;
};

export type WeatherNow = {
  label: string;
  temp: number;
  humidity: number | null;
  condition: string;
  days: DailyForecast[];
};

type GeoResult = {
  name: string;
  admin1?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
};

function weatherLabel(code: number) {
  if (code === 0) return "Céu limpo";
  if (code <= 3) return "Parcialmente nublado";
  if (code <= 48) return "Neblina";
  if (code <= 57) return "Garoa";
  if (code <= 67) return "Chuva";
  if (code <= 77) return "Neve";
  if (code <= 82) return "Pancadas de chuva";
  if (code <= 86) return "Pancadas de neve";
  if (code <= 99) return "Tempestade";
  return "Tempo variável";
}

function placeLabel(place: GeoResult) {
  return [place.name, place.admin1].filter(Boolean).join(", ");
}

function searchName(query: string) {
  return query.split(",")[0]?.trim() || query.trim();
}

export async function fetchWeather(query: string): Promise<WeatherNow | null> {
  const name = searchName(query);
  if (!name) return null;

  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=pt&country=BR`,
  );
  if (!geoRes.ok) return null;
  const geoJson = (await geoRes.json()) as { results?: GeoResult[] };
  const place = geoJson.results?.[0];
  if (!place) return null;

  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=5`,
  );
  if (!forecastRes.ok) return null;

  const data = (await forecastRes.json()) as {
    current?: {
      temperature_2m: number;
      relative_humidity_2m?: number;
      weather_code: number;
    };
    daily?: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };

  if (!data.current || !data.daily) return null;

  return {
    label: placeLabel(place),
    temp: Math.round(data.current.temperature_2m),
    humidity:
      typeof data.current.relative_humidity_2m === "number"
        ? Math.round(data.current.relative_humidity_2m)
        : null,
    condition: weatherLabel(data.current.weather_code),
    days: data.daily.time.map((date, index) => ({
      date,
      min: Math.round(data.daily!.temperature_2m_min[index]),
      max: Math.round(data.daily!.temperature_2m_max[index]),
      condition: weatherLabel(data.daily!.weather_code[index]),
    })),
  };
}

export function weekdayLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(
    new Date(year, month - 1, day),
  );
}
