"use client";

import { CloudSun, Droplets, Thermometer, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type Weather = {
  temp: number;
  humidity: number;
  wind: number;
  description: string;
};

const fallback: Weather = {
  temp: 21,
  humidity: 78,
  wind: 12,
  description: "clima ameno de serra",
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<Weather>(fallback);
  const [source, setSource] = useState("mock");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!key) return;

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Cerro%20Cora,BR&units=metric&lang=pt_br&appid=${key}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data?.main) return;
        setWeather({
          temp: Math.round(data.main.temp),
          humidity: data.main.humidity,
          wind: Math.round(data.wind?.speed * 3.6 || 0),
          description: data.weather?.[0]?.description || fallback.description,
        });
        setSource("openweather");
      })
      .catch(() => setSource("mock"));
  }, []);

  return (
    <Card className="overflow-hidden border-0 bg-[#18362f] text-white shadow-premium">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-md bg-white/12">
            <CloudSun className="h-7 w-7 text-alpine-sunset" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/60">
            Clima agora
          </p>
          <p className="mt-2 font-display text-5xl font-semibold">{weather.temp}°C</p>
          <p className="mt-2 capitalize text-white/75">{weather.description}</p>
          <p className="mt-5 text-xs text-white/45">
            {source === "mock"
              ? "Dados demonstrativos. Configure OpenWeather para tempo real."
              : "Atualizado via OpenWeather."}
          </p>
        </div>
        <div className="grid min-w-0 content-center gap-3 sm:grid-cols-2">
          <div className="min-w-0 rounded-md bg-white/10 p-5">
            <Thermometer className="mb-3 h-5 w-5 text-alpine-sunset" />
            <p className="text-sm text-white/65">Sensação serrana</p>
            <p className="break-words text-lg font-semibold leading-tight md:text-xl">
              Aconchegante
            </p>
          </div>
          <div className="min-w-0 rounded-md bg-white/10 p-5">
            <Droplets className="mb-3 h-5 w-5 text-alpine-sunset" />
            <p className="text-sm text-white/65">Umidade</p>
            <p className="text-xl font-semibold">{weather.humidity}%</p>
          </div>
          <div className="min-w-0 rounded-md bg-white/10 p-5 sm:col-span-2">
            <Wind className="mb-3 h-5 w-5 text-alpine-sunset" />
            <p className="text-sm text-white/65">Vento</p>
            <p className="text-xl font-semibold">{weather.wind} km/h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
