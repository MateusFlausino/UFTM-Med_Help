const PUBLICATION_API_URL = "https://sistemas.uftm.edu.br/integrado/sistemas/pub/ajaxPublicacao.php";
const PDF_BASE_URL = "https://sistemas.uftm.edu.br/integrado/?to=";
const TIME_ZONE = "America/Sao_Paulo";
const DAYS = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"];
const ROWS = [
  { label: "PRATO PRINCIPAL", key: "mainDish", itemsPerDay: 1 },
  { label: "OPCAO", key: "option", itemsPerDay: 1 },
  { label: "GUARNICAO", key: "garnish", itemsPerDay: 1 },
  { label: "ACOMPANHAMENTOS", key: "sides", itemsPerDay: 2 },
  { label: "SALADAS", key: "salads", itemsPerDay: 2 },
  { label: "SOBREMESA - FRUTA", key: "dessert", itemsPerDay: 1 },
  { label: "REFRESCO", key: "drink", itemsPerDay: 1 },
];

async function getTodayAbadiaMenu(now = new Date()) {
  const publication = await fetchCurrentPublication();
  const abadiaFile = findAbadiaFile(publication);
  const pdfResponse = await fetch(`${PDF_BASE_URL}${abadiaFile.link_arquivo}&secret=uftm`);

  if (!pdfResponse.ok) {
    throw new Error(`Falha ao baixar o PDF oficial da Abadia: ${pdfResponse.status}`);
  }

  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
  const entities = extractPdfEntities(pdfBuffer);
  const structuredMenu = buildStructuredMenu(entities);
  const currentDate = getCurrentDateParts(now);
  const weekdayKey = normalize(currentDate.weekday.toUpperCase()).replace("Ç", "C");
  const todayMenu = structuredMenu.byDay[weekdayKey];

  if (!todayMenu) {
    throw new Error(`Não foi encontrado cardápio para ${currentDate.weekday}.`);
  }

  return {
    unit: "Unidade Abadia",
    day: currentDate.weekday,
    date: currentDate.isoDate,
    updatedAt: toIsoDateTime(abadiaFile.pa_data, abadiaFile.pa_data_hora),
    sourceTitle: decodeHtml(abadiaFile.pa_descricao),
    sourceWeek: structuredMenu.weekRange,
    sourceUrl: `${PDF_BASE_URL}${abadiaFile.link_arquivo}&secret=uftm`,
    ...todayMenu,
  };
}

async function fetchCurrentPublication() {
  const body = new URLSearchParams({
    functionName: "getPublicacoesAtivas",
    secao: "662",
    publicacao: "",
    pagina: "1",
    encerradas: "",
    pesquisa: "",
  });

  const response = await fetch(PUBLICATION_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar a publicação do RU: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !Array.isArray(result.dados) || !result.dados.length) {
    throw new Error("A API do RU não retornou publicações ativas.");
  }

  return result.dados[0];
}

function findAbadiaFile(publication) {
  const files = Array.isArray(publication.resultArquivos) ? publication.resultArquivos : [];
  const file = files.find((item) => normalize(decodeHtml(item.pa_descricao)).includes("ABADIA"));

  if (!file) {
    throw new Error("Não encontrei o arquivo da Unidade Abadia na publicação atual.");
  }

  return file;
}

function extractPdfEntities(pdfBuffer) {
  const text = pdfBuffer.toString("latin1");
  const matches = [...text.matchAll(/(\d+) 0 obj\s*<<\/E\(([\s\S]*?)\)\/K/g)];
  return matches.map((match) => decodePdfText(match[2]).trim()).filter(Boolean);
}

function buildStructuredMenu(entities) {
  const weekLabelIndex = entities.findIndex((item) => normalize(item) === "SEMANA:");
  const weekRange = weekLabelIndex >= 0 ? entities[weekLabelIndex + 1] : "";
  const byDay = {};

  for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex += 1) {
    byDay[DAYS[dayIndex]] = {};
  }

  for (const row of ROWS) {
    const labelIndex = entities.findIndex((item) => normalize(item) === row.label);
    if (labelIndex === -1) {
      continue;
    }

    const values = entities.slice(labelIndex + 1, labelIndex + 1 + row.itemsPerDay * DAYS.length);
    for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex += 1) {
      const offset = dayIndex * row.itemsPerDay;
      const entries = values.slice(offset, offset + row.itemsPerDay).filter(Boolean);
      byDay[DAYS[dayIndex]][row.key] = entries.join("; ");
    }
  }

  return { weekRange, byDay };
}

function decodePdfText(value) {
  return value
    .replace(/\\r/g, " ")
    .replace(/\\n/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\s+/g, " ");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&atilde;/gi, "ã")
    .replace(/&otilde;/gi, "õ")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&Acirc;/gi, "Â")
    .replace(/&Aacute;/gi, "Á")
    .replace(/&Eacute;/gi, "É")
    .replace(/&Oacute;/gi, "Ó")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function getCurrentDateParts(now) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  const weekday = capitalize(String(get("weekday")).split("-")[0]);
  return {
    weekday,
    isoDate: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

function toIsoDateTime(brDate, hour) {
  const [day, month, year] = String(brDate || "").split("/");
  return `${year}-${month}-${day}T${hour}:00-03:00`;
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

module.exports = {
  getTodayAbadiaMenu,
};
