// packages/ai-service/src/scraper.ts
import * as cheerio from "cheerio";

export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
}

export async function scrapePage(url: string): Promise<ScrapedPage> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  // strip noise before extracting text
  $("script, style, nav, footer, header, noscript").remove();

  const title = $("title").text().trim();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  return { url, title, text };
}

// Discover internal links on a page, so we can crawl beyond a single URL
export async function extractInternalLinks(url: string, baseUrl: string): Promise<string[]> {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const resolved = new URL(href, baseUrl).toString().split("#")[0];
      if (resolved.startsWith(baseUrl)) links.add(resolved);
    } catch {
      // ignore malformed hrefs
    }
  });

  return Array.from(links);
}