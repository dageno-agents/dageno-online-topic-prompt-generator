import { load } from "cheerio/slim";
import { XMLParser } from "fast-xml-parser";
import robotsParser from "robots-parser";
import { stableId, normalizeText } from "./contract.mjs";

const xml = new XMLParser({ ignoreAttributes: false });
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const USER_AGENT = "DagenoResearchBot/3.0";
const clean = value => String(value || "").replace(/\s+/g, " ").trim();

export function publicUrl(value, base) {
  const url = new URL(value, base);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !host.includes(".") || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host) || /[:\[\]]/.test(host) || /^\d+(?:\.\d+)*$/.test(host)) throw new Error("Only public HTTPS domain URLs are allowed");
  url.hash = "";
  return url.toString();
}

export function privateAddress(value) {
  const ip = String(value).toLowerCase();
  if (ip.includes(":")) return /^(?:::|fc|fd|fe[89ab]|ff)/.test(ip) || ip.startsWith("2001:db8:");
  const [a, b] = ip.split(".").map(Number);
  return !Number.isFinite(a) || a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && [0, 168].includes(b) || a === 100 && b >= 64 && b <= 127 || a >= 224 || a === 198 && [18, 19, 51].includes(b) || a === 203 && b === 0;
}

export function createNetwork({ fetchImpl = fetch, maxRequests = 180, timeoutMs = 15000, verifyDns = true } = {}) {
  let requests = 0;
  const dnsChecked = new Map();
  const trace = [];
  async function request(url, options = {}) {
    if (++requests > maxRequests) throw new Error("Research request budget exhausted; coverage is incomplete");
    const response = await fetchImpl(url, { ...options, redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    return response;
  }
  async function checkDns(host) {
    if (!verifyDns) return;
    if (!dnsChecked.has(host)) dnsChecked.set(host, (async () => {
      const res = await request(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`, { headers: { accept: "application/dns-json" } });
      if (!res.ok) throw new Error("Unable to verify public DNS");
      const records = (await res.json()).Answer || [];
      const addresses = records.filter(r => [1, 28].includes(r.type)).map(r => r.data);
      if (!addresses.length || addresses.some(privateAddress)) throw new Error("Target DNS is not a verified public address");
    })());
    return dnsChecked.get(host);
  }
  async function get(value) {
    let url = publicUrl(value);
    const startedAt = Date.now();
    try {
      for (let redirects = 0; redirects < 5; redirects++) {
        await checkDns(new URL(url).hostname);
        const res = await request(url, { headers: { "user-agent": USER_AGENT, accept: "text/html,application/xml,text/xml,text/plain,application/json" } });
        if ([301, 302, 303, 307, 308].includes(res.status)) { const location = res.headers.get("location"); await res.body?.cancel(); url = publicUrl(location, url); continue; }
        if (!res.ok) { await res.body?.cancel(); throw new Error(`HTTP ${res.status}`); }
        const type = res.headers.get("content-type") || "";
        if (!/text|xml|json|html/.test(type)) { await res.body?.cancel(); throw new Error(`Unsupported content type: ${type}`); }
        const reader = res.body.getReader();
        const chunks = []; let bytes = 0;
        try {
          while (true) {
            const { done, value: part } = await reader.read();
            if (done) break;
            bytes += part.byteLength;
            if (bytes > 3_000_000) throw new Error("Page exceeds 3MB research budget");
            chunks.push(part);
          }
        } finally { await reader.cancel().catch(() => {}); }
        const merged = new Uint8Array(bytes); let offset = 0;
        for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
        trace.push({ url: value, finalUrl: url, status: "read", bytes, elapsedMs: Date.now() - startedAt });
        return { url, text: new TextDecoder().decode(merged), type };
      }
      throw new Error("Too many redirects");
    } catch (error) { trace.push({ url: value, status: "failed", reason: error.message }); throw error; }
  }
  return { get, trace, get requests() { return requests; } };
}

export function parsePage(html, url) {
  const $ = load(html);
  const title = clean($("title").first().text());
  const meta = clean($('meta[name="description"]').attr("content"));
  const links = [...new Set($("a[href]").toArray().map(el => { try { return publicUrl($(el).attr("href"), url); } catch { return ""; } }).filter(Boolean))];
  const structuredData = $('script[type="application/ld+json"]').toArray().flatMap(el => { try { return [JSON.parse($(el).text())]; } catch { return []; } });
  $("script,style,noscript,svg,nav,footer,header,form,[hidden],[aria-hidden='true']").remove();
  const main = $("main,[role=main]").first();
  const root = main.length ? main : $("body").length ? $("body") : $.root();
  const headings = root.find("h1,h2,h3").toArray().map(el => clean($(el).text())).filter(Boolean);
  const paragraphs = root.find("h1,h2,h3,p,li,td,dt,dd").toArray().map(el => clean($(el).text())).filter(Boolean);
  const fullText = [...new Set(paragraphs)].join("\n") || clean(root.text());
  const excerpt = fullText.length > 14000 ? [fullText.slice(0, 6000), fullText.slice(Math.floor(fullText.length / 2), Math.floor(fullText.length / 2) + 4000), fullText.slice(-4000)].join("\n[excerpt gap]\n") : fullText;
  const blocked = /^(?:just a moment|access denied|attention required)|checking your browser|verify you are human|enable javascript and cookies/i.test(`${title} ${fullText.slice(0, 500)}`);
  return { url, title, meta, headings, text: excerpt, fullTextLength: fullText.length, excerpted: fullText.length > 14000, links, structuredData, usable: !blocked && fullText.length >= 160 };
}

export function sitemapLocations(text, base) {
  const parsed = xml.parse(text);
  return { sitemaps: array(parsed.sitemapindex?.sitemap).map(x => x.loc), urls: array(parsed.urlset?.url).map(x => x.loc) };
}

export function pageFamily(url) {
  const path = new URL(url).pathname.toLowerCase();
  if (path === "/" || /^\/[a-z]{2}(?:-[a-z]{2})?\/?$/.test(path)) return "home";
  if (/pricing|plans|fees|quote/.test(path)) return "commercial";
  if (/customer|case-stud|portfolio|testimonial/.test(path)) return "proof";
  if (/doc|support|help|faq|security|legal|privacy|certif/.test(path)) return "documentation_trust";
  if (/product|collection|catalog|shop|service|course|program/.test(path)) return "offering";
  if (/solution|use-case|industr|application/.test(path)) return "scenario";
  if (/about|company|contact|location/.test(path)) return "entity";
  return "other";
}

export function stratifiedUrls(urls) {
  const groups = new Map();
  for (const url of urls) {
    const family = pageFamily(url);
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(url);
  }
  const ordered = [];
  for (let i = 0; [...groups.values()].some(g => g[i]); i++) for (const family of ["home", "offering", "scenario", "commercial", "proof", "documentation_trust", "entity", "other"]) { const next = groups.get(family)?.[i]; if (next) ordered.push(next); }
  return ordered;
}

export async function sourceFromPage(page, kind = "owned_page") {
  return { id: await stableId("src", page.url), type: kind, url: page.url, publisher: new URL(page.url).hostname.replace(/^www\./, ""), title: page.title, snippet: [page.meta, ...page.headings, page.text].filter(Boolean).join("\n"), retrievedAt: new Date().toISOString(), contentHash: await stableId("sha", page.text), extraction: page.extraction || "html", excerpted: page.excerpted, family: pageFamily(page.url) };
}

export async function crawlWebsite(domain, network, { maxPages = 24, maxSitemaps = 8, extraUrls = [] } = {}) {
  const base = publicUrl(/^https?:/.test(domain) ? domain.replace(/^http:/, "https:") : `https://${domain}`);
  let host = new URL(base).hostname;
  const allowedHost = url => { const h = new URL(url).hostname.replace(/^www\./, ""); const root = host.replace(/^www\./, ""); return h === root || ["docs", "help", "support"].some(prefix => h === `${prefix}.${root}`); };
  const failures = [], pages = [], seen = new Set(), signatures = new Set();
  let robots;
  try { const res = await network.get(new URL("/robots.txt", base).href); robots = robotsParser(res.url, res.text); } catch (e) { failures.push({ url: new URL("/robots.txt", base).href, reason: e.message }); }
  const allowed = url => allowedHost(url) && robots?.isAllowed(url, USER_AGENT) !== false;
  let first;
  if (!allowed(base)) throw new Error("robots.txt disallows the target page");
  try { first = await network.get(base); host = new URL(first.url).hostname; } catch (e) { failures.push({ url: base, reason: e.message }); }
  const inventory = new Set([first?.url || base, ...extraUrls.filter(allowed)]);
  const sitemapQueue = [...new Set([...(robots?.getSitemaps() || []), new URL("/sitemap.xml", base).href])];
  const sitemapSeen = new Set();
  while (sitemapQueue.length && sitemapSeen.size < maxSitemaps) {
    const url = sitemapQueue.shift(); if (sitemapSeen.has(url) || !allowedHost(url)) continue; sitemapSeen.add(url);
    try { const res = await network.get(url); const map = sitemapLocations(res.text, res.url); for (const entry of map.urls) { try { const u = publicUrl(entry, res.url); if (allowed(u)) inventory.add(u); } catch {} } for (const child of map.sitemaps) { try { sitemapQueue.push(publicUrl(child, res.url)); } catch {} } } catch (e) { failures.push({ url, reason: e.message }); }
    if (inventory.size > 5000) break;
  }
  const home = first ? parsePage(first.text, first.url) : null;
  for (const url of home?.links || []) if (allowed(url)) inventory.add(url);
  for (const path of ["/products", "/solutions", "/pricing", "/about", "/docs"]) inventory.add(new URL(path, first?.url || base).href);
  let attempts = 0;
  while (pages.length < maxPages && attempts < maxPages * 2) {
    const candidates = stratifiedUrls([...inventory].filter(u => !seen.has(u) && allowed(u) && !/\.(?:png|jpg|svg|pdf|zip|xml)(?:$|\?)/i.test(u)));
    if (!candidates.length) break;
    const url = candidates[0]; seen.add(url); attempts++;
    try {
      const res = url === first?.url ? first : await network.get(url);
      let page = parsePage(res.text, res.url);
      if (!page.usable) {
        // Public reader fallback is labelled, never treated as browser rendering.
        const reader = await network.get(`https://r.jina.ai/${url}`);
        const text = reader.text.replace(/^.*Markdown Content:\s*/s, "").trim();
        if (text.length > 200 && !/checking your browser|access denied/i.test(text.slice(0, 500))) page = { ...page, text: text.slice(0, 14000), extraction: "reader_proxy", usable: true, excerpted: text.length > 14000 };
      }
      if (!page.usable) throw new Error("No usable business content; rendering or manual evidence required");
      const signature = normalizeText(page.text);
      if (signatures.has(signature)) continue;
      signatures.add(signature); pages.push(page);
      for (const link of page.links) if (allowed(link)) inventory.add(link);
    } catch (e) { failures.push({ url, reason: e.message }); }
  }
  return { pages, sources: await Promise.all(pages.map(p => sourceFromPage(p))), attempted: [...seen], discoveredUrls: [...inventory], failures, sitemapCount: sitemapSeen.size, remainingSitemaps: sitemapQueue.length, remainingUrls: [...inventory].filter(x => !seen.has(x)).length, families: [...new Set(pages.map(p => pageFamily(p.url)))], budgetLimited: pages.length >= maxPages || sitemapQueue.length > 0 };
}

export function parseSearch(html, engine = "ddg") {
  if (engine === "bing") return array(xml.parse(html).rss?.channel?.item).map(row => ({ title: clean(row.title), url: row.link, snippet: clean(row.description) }));
  const $ = load(html);
  return $(".result").toArray().map(el => {
    const link = $(el).find(".result__a"); let url = link.attr("href") || "";
    try { const parsed = new URL(url, "https://duckduckgo.com"); url = parsed.searchParams.get("uddg") || parsed.href; } catch {}
    return { title: clean(link.text()), url, snippet: clean($(el).find(".result__snippet").text()) };
  });
}

export async function searchWeb(queries, network, { region = "US", language = "en-US", limit = 18 } = {}) {
  const signals = [], log = [], seen = new Set();
  for (const item of queries.slice(0, limit)) {
    const query = typeof item === "string" ? item : item.query;
    let results = [], provider = "", error = "";
    for (const [engine, url] of [
      ["bing", `https://www.bing.com/search?format=rss&mkt=${encodeURIComponent(language)}&cc=${region}&q=${encodeURIComponent(query)}`],
      ["ddg", `https://html.duckduckgo.com/html/?kl=${region.toLowerCase()}-${language.split("-")[0]}&q=${encodeURIComponent(query)}`]
    ]) {
      try { const res = await network.get(url); results = parseSearch(res.text, engine).filter(x => x.title && x.snippet && x.url); provider = engine; if (results.length) break; } catch (e) { error = e.message; }
    }
    log.push({ query, purpose: item.purpose || "research", provider, resultCount: results.length, error: results.length ? "" : error || "No parseable search results" });
    for (const result of results.slice(0, 5)) {
      try {
        const url = publicUrl(result.url); const key = `${query}|${url}`;
        if (seen.has(key)) continue; seen.add(key);
        signals.push({ ...result, url, id: await stableId("src", key), type: "search_snippet", publisher: new URL(url).hostname.replace(/^www\./, ""), query, category: item.purpose || "research", marketKey: item.marketKey || "", retrievedAt: new Date().toISOString(), contentHash: await stableId("sha", result.snippet) });
      } catch {}
    }
  }
  return { signals, log, remainingQueries: queries.length > limit ? queries.slice(limit) : [] };
}
