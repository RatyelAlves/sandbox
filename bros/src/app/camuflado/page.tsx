"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import {
  CLIMA_CITY_KEY,
  fetchWeather,
  weekdayLabel,
  type WeatherNow,
} from "@/lib/weather";

const FALLBACK_CITY = "São Paulo, SP";

export default function CamufladoPage() {
  const [taps, setTaps] = useState(0);
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "empty">("loading");

  useEffect(() => {
    document.title = "Clima Hoje — Previsão";

    const trap = () => {
      window.history.pushState(null, "", window.location.href);
    };
    trap();
    window.addEventListener("popstate", trap);

    return () => {
      window.removeEventListener("popstate", trap);
      document.title = "Bros";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveCity() {
      const stored = sessionStorage.getItem(CLIMA_CITY_KEY)?.trim();
      if (stored) return stored;

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from("profiles")
              .select("city")
              .eq("id", user.id)
              .maybeSingle();
            if (data?.city) return data.city as string;
          }
        } catch {
          // Página camuflada: se falhar, cai no fallback.
        }
      }

      return FALLBACK_CITY;
    }

    resolveCity()
      .then((city) => loadWeather(city, cancelled))
      .catch(() => {
        if (!cancelled) setStatus("empty");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadWeather(city: string, cancelled = false) {
    setStatus("loading");
    setQuery(city);
    const result = await fetchWeather(city);
    if (cancelled) return;
    if (!result) {
      setWeather(null);
      setStatus("empty");
      return;
    }
    sessionStorage.setItem(CLIMA_CITY_KEY, city);
    setWeather(result);
    setStatus("ok");
  }

  function onLogo() {
    const next = taps + 1;
    setTaps(next);
    if (next >= 3) {
      window.location.replace("/descobrir");
    }
  }

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    const city = query.trim();
    if (!city) return;
    await loadWeather(city);
  }

  return (
    <div className="min-h-full bg-[#f4f6f8] text-[#1c2430]">
      <header className="border-b border-[#d5dbe3] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button
            type="button"
            onClick={onLogo}
            className="text-lg font-semibold tracking-tight text-[#1a6bb5]"
          >
            ClimaHoje
          </button>
          <p className="text-xs text-[#5b6775]">Brasil · agora</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Previsão do tempo</h1>
        <p className="mt-1 text-sm text-[#5b6775]">
          Busque a cidade e veja a previsão dos próximos dias.
        </p>

        <form onSubmit={onSearch} className="mt-6 flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cidade, UF"
            className="h-11 flex-1 rounded-md border border-[#d5dbe3] bg-white px-3 text-sm outline-none focus:border-[#1a6bb5]"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-[#1a6bb5] px-4 text-sm font-medium text-white"
          >
            Buscar
          </button>
        </form>

        {status === "loading" ? (
          <p className="mt-8 text-sm text-[#5b6775]">Carregando previsão…</p>
        ) : null}

        {status === "empty" ? (
          <p className="mt-8 text-sm text-[#5b6775]">
            Não encontramos essa cidade. Tente outro nome.
          </p>
        ) : null}

        {status === "ok" && weather ? (
          <div className="mt-6 space-y-4">
            <article className="rounded-lg border border-[#d5dbe3] bg-white px-5 py-6">
              <p className="text-sm text-[#5b6775]">{weather.label}</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <p className="text-6xl font-light leading-none">{weather.temp}°</p>
                <div className="text-right text-sm text-[#5b6775]">
                  <p className="text-base text-[#1c2430]">{weather.condition}</p>
                  {weather.humidity != null ? <p>Umidade {weather.humidity}%</p> : null}
                </div>
              </div>
            </article>

            <section className="overflow-hidden rounded-lg border border-[#d5dbe3] bg-white">
              <h2 className="border-b border-[#d5dbe3] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#5b6775]">
                Próximos dias
              </h2>
              <ul className="divide-y divide-[#d5dbe3]">
                {weather.days.map((day) => (
                  <li
                    key={day.date}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="w-16 capitalize">{weekdayLabel(day.date)}</span>
                    <span className="flex-1 text-[#5b6775]">{day.condition}</span>
                    <span>
                      {day.min}° / {day.max}°
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </main>

      <footer className="mx-auto max-w-3xl px-4 py-8 text-xs text-[#8a93a0]">
        ClimaHoje — previsão via Open-Meteo.
      </footer>
    </div>
  );
}
