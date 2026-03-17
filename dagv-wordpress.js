const BASE_URL = "https://dagvmeduftm.wordpress.com";
const CACHE_TTL_MS = 10 * 60 * 1000;

const TAB_SOURCES = {
  home: [
    { sourceLabel: "Página inicial", url: `${BASE_URL}/` },
  ],
  elections: [
    { sourceLabel: "Eleições DAGV", url: `${BASE_URL}/eleicoes-dagv/` },
  ],
  dagv: [
    { sourceLabel: "DAGV", url: `${BASE_URL}/dagv/` },
    { sourceLabel: "Estatuto", url: `${BASE_URL}/dagv/estatuto-dagv/` },
    { sourceLabel: "Localização", url: `${BASE_URL}/dagv/localizacao/` },
    { sourceLabel: "Galeria de fotos", url: `${BASE_URL}/dagv/galeria-de-fotos/` },
  ],
  coordination: [
    { sourceLabel: "Coordenação", url: `${BASE_URL}/coordenacao/` },
    { sourceLabel: "Coordenação Geral", url: `${BASE_URL}/coordenacao/coordenacao-geral/` },
    { sourceLabel: "Secretaria Geral", url: `${BASE_URL}/coordenacao/secretaria-geral/` },
    { sourceLabel: "Finanças e Patrimônio", url: `${BASE_URL}/coordenacao/coordenacao-de-financas-e-patrimonio/` },
    { sourceLabel: "Comunicação", url: `${BASE_URL}/coordenacao/coordenacao-de-comunicacao/` },
    { sourceLabel: "Ensino, Pesquisa e Extensão", url: `${BASE_URL}/coordenacao/coordenacao-de-ensino-pesquisa-e-extensao/` },
    { sourceLabel: "Sociocultural", url: `${BASE_URL}/coordenacao/coordenacao-sociocultural/` },
    { sourceLabel: "Representação Estudantil", url: `${BASE_URL}/coordenacao/coordenacao-de-representacao-estudantil/` },
    { sourceLabel: "Desenvolvimento Tecnológico", url: `${BASE_URL}/coordenacao/coordenacao-de-desenvolvimento-tecnologico/` },
  ],
  agenda: [
    { sourceLabel: "Agenda Medicina", url: `${BASE_URL}/agenda-medicina/` },
    { sourceLabel: "Eventos Acadêmicos", url: `${BASE_URL}/eventos-academicos/` },
    { sourceLabel: "Festas", url: `${BASE_URL}/festas/` },
  ],
  info: [
    { sourceLabel: "Informações", url: `${BASE_URL}/informacoes-2/` },
    { sourceLabel: "DENEM", url: `${BASE_URL}/denem/` },
    { sourceLabel: "DCE UFTM", url: `${BASE_URL}/dce-uftm/` },
    { sourceLabel: "Exigências Horárias", url: `${BASE_URL}/exigencias-horarias/` },
    { sourceLabel: "CVU Uberaba", url: `${BASE_URL}/cvu-uberaba/` },
    { sourceLabel: "CEPOP UFTM", url: `${BASE_URL}/cepop-uftm/` },
  ],
  links: [
    { sourceLabel: "PET Medicina", url: `${BASE_URL}/pet-medicina-1/` },
    { sourceLabel: "Cursinho Carolina", url: `${BASE_URL}/cursinho-carolina/` },
    { sourceLabel: "Ligas Acadêmicas", url: `${BASE_URL}/ligas-academicas/` },
    { sourceLabel: "Instagram", url: `${BASE_URL}/instagram/` },
    { sourceLabel: "Loja Online DAGV", url: `${BASE_URL}/loja-online-dagv/` },
    { sourceLabel: "Divulgação", url: `${BASE_URL}/divulgacao/` },
  ],
};
const NEWS_SOURCES = [
  { sourceLabel: "Página inicial", url: `${BASE_URL}/` },
  { sourceLabel: "Eleições DAGV", url: `${BASE_URL}/eleicoes-dagv/` },
  { sourceLabel: "Agenda Medicina", url: `${BASE_URL}/agenda-medicina/` },
  { sourceLabel: "Festas", url: `${BASE_URL}/festas/` },
];

const tabCache = new Map();
let newsCache = { expiresAt: 0, items: [] };

module.exports = {
  getDagvContent,
};

async function getDagvContent(tab = "home") {
  const normalizedTab = TAB_SOURCES[tab] ? tab : "home";
  const cached = tabCache.get(normalizedTab);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const sources = TAB_SOURCES[normalizedTab];
  const [pages, news] = await Promise.all([
    Promise.all(sources.map(fetchPageContent)),
    fetchLatestNews(5),
  ]);

  const payload = {
    tab: normalizedTab,
    pages,
    news,
    generatedAt: new Date().toISOString(),
  };

  tabCache.set(normalizedTab, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    payload,
  });

  return payload;
}

async function fetchPageContent(source) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "AgendaDAGV/1.0 (+https://dagvmeduftm.wordpress.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`falha ao buscar ${source.sourceLabel}: ${response.status}`);
  }

  const html = await response.text();
  const contentHtml = extractEntryContentHtml(html) || extractMainHtml(html);
  const blocks = extractBlocks(contentHtml);

  return {
    sourceLabel: source.sourceLabel,
    url: source.url,
    title: extractEntryTitle(html) || source.sourceLabel,
    summary: buildSummary(blocks),
    blocks: blocks.slice(0, 14),
    image: extractFirstImage(contentHtml),
    publishedAt: extractPublishedAt(html),
  };
}

async function fetchLatestNews(limit = 5) {
  if (newsCache.expiresAt > Date.now() && newsCache.items.length) {
    return newsCache.items.slice(0, limit);
  }

  const response = await fetch(`${BASE_URL}/feed/`, {
    headers: {
      "user-agent": "AgendaDAGV/1.0 (+https://dagvmeduftm.wordpress.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`falha ao buscar feed do DAGV: ${response.status}`);
  }

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .map((match) => parseFeedItem(match[1]))
    .filter((item) => item.title);

  if (!items.length) {
    const pageFallback = await Promise.all(NEWS_SOURCES.map(fetchPageContent));
    const fallbackItems = pageFallback
      .map((page) => ({
        title: page.title || page.sourceLabel,
        link: page.url,
        publishedAt: page.publishedAt || "",
        summary: page.summary || buildSummary(page.blocks || []),
        sourceLabel: page.sourceLabel || "DAGV",
      }))
      .filter((item) => item.title && item.summary)
      .slice(0, limit);

    newsCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      items: fallbackItems,
    };

    return fallbackItems;
  }

  newsCache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    items,
  };

  return items;
}

function parseFeedItem(xml) {
  const title = decodeHtml(stripTags(extractTag(xml, "title")));
  const link = decodeHtml(stripTags(extractTag(xml, "link")));
  const publishedAt = decodeHtml(stripTags(extractTag(xml, "pubDate")));
  const description = extractTag(xml, "description") || extractCdata(xml, "content:encoded");
  const summary = buildExcerpt(decodeHtml(stripTags(description)));

  return {
    title,
    link,
    publishedAt,
    summary,
  };
}

function extractEntryTitle(html) {
  return decodeHtml(stripTags(firstMatch(html, /<h1 class="entry-title">([\s\S]*?)<\/h1>/i)));
}

function extractEntryContentHtml(html) {
  return firstMatch(html, /<div class="entry-content">([\s\S]*?)<\/div><!-- \.entry-content -->/i);
}

function extractMainHtml(html) {
  return firstMatch(html, /<main id="main" class="site-main">([\s\S]*?)<\/main>/i);
}

function extractPublishedAt(html) {
  return firstMatch(html, /<time[^>]+datetime="([^"]+)"/i);
}

function extractFirstImage(html) {
  const src = firstMatch(html, /<img[^>]+src="([^"]+)"/i);
  return src ? decodeHtml(src) : "";
}

function extractBlocks(contentHtml) {
  if (!contentHtml) {
    return [];
  }

  const blocks = [];
  const pattern = /<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  for (const match of contentHtml.matchAll(pattern)) {
    const tag = String(match[1] || "").toLowerCase();
    const text = decodeHtml(stripTags(match[2]));
    if (shouldIgnoreText(text)) {
      continue;
    }

    if (tag === "h2" || tag === "h3") {
      blocks.push({ type: "heading", text });
      continue;
    }

    if (tag === "li") {
      blocks.push({ type: "list", text });
      continue;
    }

    blocks.push({ type: "paragraph", text });
  }

  return compactBlocks(blocks);
}

function compactBlocks(blocks) {
  const compact = [];

  for (const block of blocks) {
    const previous = compact[compact.length - 1];
    if (block.type === "paragraph" && previous?.type === "paragraph") {
      if ((previous.text.length + block.text.length) < 320) {
        previous.text = `${previous.text} ${block.text}`.trim();
        continue;
      }
    }
    compact.push({ ...block });
  }

  return compact;
}

function buildSummary(blocks) {
  const paragraphText = blocks
    .filter((block) => block.type === "paragraph")
    .map((block) => block.text)
    .join(" ");

  if (paragraphText) {
    return buildExcerpt(paragraphText, 220);
  }

  const listText = blocks
    .filter((block) => block.type === "list")
    .map((block) => block.text)
    .join(" ");

  return buildExcerpt(listText, 220);
}

function buildExcerpt(text, maxLength = 180) {
  const normalized = normalizeSpacing(text);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function shouldIgnoreText(text) {
  const normalized = normalizeSpacing(text).toLowerCase();
  if (!normalized || normalized.length < 3) {
    return true;
  }

  return /^(compartilhe isso|curtir isso|carregando|anterior|próximo|assinar|assinado|gerenciar assinaturas|esconder esta barra)$/.test(normalized);
}

function extractTag(xml, tagName) {
  const pattern = new RegExp(`<${escapeRegex(tagName)}[^>]*>([\\s\\S]*?)<\\/${escapeRegex(tagName)}>`, "i");
  return firstMatch(xml, pattern);
}

function extractCdata(xml, tagName) {
  const raw = extractTag(xml, tagName);
  return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, "$1");
}

function firstMatch(text, pattern) {
  const match = String(text || "").match(pattern);
  return match && match[1] ? match[1] : "";
}

function stripTags(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function normalizeSpacing(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return normalizeSpacing(String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">"));
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
