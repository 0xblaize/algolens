import type { PublicSignal, SignalDataState } from "./types";

type NewsApiArticle = {
  title?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  source?: { name?: string };
};

export async function getPublicSignals(): Promise<SignalDataState> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return {
      status: "not-configured",
      missing: ["NEWS_API_KEY"],
      message: "Signal API not configured. Add NEWS_API_KEY to load public market signals.",
    };
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        "prediction markets OR inflation OR crypto liquidity OR election odds",
      )}&language=en&sortBy=publishedAt&pageSize=10`,
      {
        headers: { "X-Api-Key": apiKey },
        next: { revalidate: 180 },
      },
    );

    if (!response.ok) {
      throw new Error(`Signal API returned ${response.status}`);
    }

    const payload = (await response.json()) as { articles?: NewsApiArticle[] };
    const signals: PublicSignal[] = (payload.articles ?? [])
      .filter((article) => article.title)
      .map((article, index) => ({
        id: `newsapi-${index}-${article.publishedAt ?? Date.now()}`,
        title: article.title ?? "Untitled signal",
        source: article.source?.name ?? "News API",
        sourceUrl: article.url,
        timestamp: article.publishedAt ?? new Date().toISOString(),
        confidence: 60 + ((index * 7) % 30),
        category: "Public Signal",
        summary: article.description ?? "Public signal loaded from configured news provider.",
      }));

    return { status: "configured", signals, source: "News API" };
  } catch (error) {
    return {
      status: "error",
      message: "Unable to load public signals.",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
