import { z } from "zod";

const weatherResponseSchema = z.object({
  main: z.object({
    temp: z.number().finite(),
    humidity: z.number().finite().min(0).max(100),
  }),
  wind: z.object({ speed: z.number().finite().nonnegative() }).optional(),
  weather: z.array(z.object({ description: z.string().trim().max(120) })).min(1),
});

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, unavailable: true }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", "Cerro Cora,BR");
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "pt_br");
    url.searchParams.set("appid", apiKey);

    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 900 },
    });
    if (!response.ok) {
      console.error("[weather] upstream failed", { status: response.status });
      return Response.json({ ok: false, unavailable: true }, { status: 503 });
    }

    const parsed = weatherResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("[weather] invalid upstream response");
      return Response.json({ ok: false, unavailable: true }, { status: 503 });
    }

    return Response.json(
      {
        ok: true,
        weather: {
          temp: Math.round(parsed.data.main.temp),
          humidity: Math.round(parsed.data.main.humidity),
          wind: Math.round((parsed.data.wind?.speed || 0) * 3.6),
          description: parsed.data.weather[0]!.description,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return Response.json({ ok: false, unavailable: true }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
