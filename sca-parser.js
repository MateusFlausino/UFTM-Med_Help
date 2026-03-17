const DAY_ORDER = ["segunda", "terca", "quarta", "quinta", "sexta"];
const DAY_LABELS = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
};
const DAY_TO_WEEKDAY = {
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
};
const PDFJS_IMPORT_CANDIDATES = [
  "./vendor/pdfjs/pdf.mjs",
  "./node_modules/pdfjs-dist/legacy/build/pdf.mjs",
];
let pdfjsModulePromise = null;

export async function extractScaPdfData(file, fallbackProfile = {}) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: buffer,
    disableWorker: true,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const items = textContent.items
      .map((item) => ({
        text: String(item.str || "").trim(),
        x: Number(item.transform?.[4] || 0),
        y: Number(item.transform?.[5] || 0),
        width: Number(item.width || 0),
        height: Math.abs(Number(item.height || 0)) || 10,
      }))
      .filter((item) => item.text);

    const lines = groupItemsIntoLines(items);
    pages.push({
      pageNumber,
      lines,
      text: lines.map((line) => line.text).join("\n"),
      rawText: normalizeSpacing(textContent.items.map((item) => String(item.str || "").trim()).filter(Boolean).join(" ")),
    });
  }

  const fullText = normalizeSpacing(pages.map((page) => page.rawText || page.text).join(" "));
  const profile = extractProfile(fullText, fallbackProfile, pdf.numPages);
  const disciplines = extractDisciplines(fullText);
  const schedule = extractSchedule(fullText);

  return {
    profile,
    disciplines: disciplines.length ? disciplines : buildDisciplinesFromSchedule(schedule),
    schedule,
    extractedAt: new Date().toISOString(),
    summary: {
      disciplineCount: disciplines.length || uniqueBy(schedule, (item) => item.title).length,
      classCount: schedule.length,
      hasSchedule: Boolean(schedule.length),
    },
  };
}

async function loadPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = loadLocalPdfJs().catch(() => {
      pdfjsModulePromise = null;
      throw new Error("não consegui carregar o leitor de PDF necessário para importar este arquivo");
    });
  }
  return pdfjsModulePromise;
}

async function loadLocalPdfJs() {
  for (const candidate of PDFJS_IMPORT_CANDIDATES) {
    try {
      return await import(candidate);
    } catch (error) {
      // tenta o próximo caminho local disponível
    }
  }

  throw new Error("pdf.js indisponível");
}

function groupItemsIntoLines(items) {
  const sorted = [...items].sort((left, right) => {
    if (Math.abs(right.y - left.y) > 2) {
      return right.y - left.y;
    }
    return left.x - right.x;
  });
  const lines = [];

  for (const item of sorted) {
    const currentLine = lines[lines.length - 1];
    if (!currentLine || Math.abs(currentLine.y - item.y) > 2.5) {
      lines.push({ y: item.y, items: [item] });
      continue;
    }
    currentLine.items.push(item);
  }

  return lines
    .map((line) => {
      const ordered = [...line.items].sort((left, right) => left.x - right.x);
      let text = "";
      let previous = null;

      for (const item of ordered) {
        if (previous) {
          const gap = item.x - (previous.x + previous.width);
          const shouldPad = gap > Math.max(3, previous.height * 0.3);
          text += shouldPad ? ` ${item.text}` : item.text;
        } else {
          text = item.text;
        }
        previous = item;
      }

      return {
        y: line.y,
        text: normalizeSpacing(text),
      };
    })
    .filter((line) => line.text);
}

function extractProfile(fullText, fallbackProfile, pages) {
  const normalizedText = normalizeSpacing(fullText);
  const academicRecord = normalizedText.match(
    /Acad[eê]mico\s*:\s*([0-9.\-/]+)\s*-\s*(.+?)(?=\bDisciplina\b|\bC\.H\b|\bDia da Semana\b|Página\s+\d+\/\d+)/i
  );

  return {
    sourceTitle: "Relação de Disciplinas por Acadêmico",
    course: pickFirstMatch(normalizedText, [
      /(\d{4}\/\d{2}\s*-\s*[A-ZÀ-ÚÇÃÕ0-9\s]+\([^)]+\))/i,
      /Curso\s*:\s*([^]+?)(?=Per[ií]odo|Acad[eê]mico|Aluno|Matr[ií]cula|RA)/i,
    ]) || fallbackProfile.course || "",
    period: pickFirstMatch(normalizedText, [
      /Per[ií]odo(?:\s+Letivo)?\s*:\s*([0-9]{4}\s*-\s*\d+)/i,
      /\b([0-9]{4}\s*-\s*[12])\b/,
    ]) || fallbackProfile.period || "",
    studentId: pickFirstMatch(normalizedText, [
      /Matr[ií]cula\s*:\s*([0-9.\-/]+)/i,
      /\bRA\s*:\s*([0-9.\-/]+)/i,
      /Acad[eê]mico\s*:\s*([0-9.\-/]+)/i,
    ]) || academicRecord?.[1] || fallbackProfile.studentId || "",
    studentName: cleanPersonName(
      pickFirstMatch(normalizedText, [
        /Aluno\s*:\s*([^]+?)(?=Matr[ií]cula|RA|Curso|Per[ií]odo)/i,
        /Nome\s*:\s*([^]+?)(?=Matr[ií]cula|RA|Curso|Per[ií]odo)/i,
      ]) || academicRecord?.[2] || fallbackProfile.studentName || fallbackProfile.displayName || ""
    ),
    pages,
  };
}

function extractDisciplines(fullText) {
  const beforeWeek = splitBeforeWeekSchedule(fullText);
  const entries = [];
  const pattern = /(\d{4}\.\d{3}\.\d{3}-\d)\s*-\s*(.+?)\s+(\d+(?:[.,]\d+)?)\s+([A-ZÀ-ÚÇÃÕ.\- ]+?)\s+\(([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\)\s+(\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4})/gi;

  for (const match of beforeWeek.matchAll(pattern)) {
    entries.push({
      code: match[1] || "",
      name: cleanTitle(match[2] || ""),
      workload: String(match[3] || "").replace(",", "."),
      teacher: cleanPersonName(match[4] || ""),
      email: String(match[5] || "").toLowerCase(),
      period: match[6] || "",
    });
  }

  if (entries.length) {
    return uniqueBy(entries, (item) => item.code);
  }

  const blocks = beforeWeek
    .split(/(?=\d{4}\.\d{3}\.\d{3}-\d)/g)
    .map((item) => normalizeSpacing(item))
    .filter((item) => /^\d{4}\.\d{3}\.\d{3}-\d/.test(item));

  return blocks.map((block) => {
    const code = pickFirstMatch(block, [/^(\d{4}\.\d{3}\.\d{3}-\d)/]);
    const email = pickFirstMatch(block, [/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i]);
    const period = pickFirstMatch(block, [/\b(\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4})\b/]);
    let remaining = block
      .replace(code || "", "")
      .replace(email || "", "")
      .replace(period || "", "")
      .trim();

    const workloadMatch = remaining.match(/\b\d+(?:[.,]\d+)?\b/);
    const workload = workloadMatch ? workloadMatch[0].replace(",", ".") : "";
    let name = remaining;
    let teacher = "";

    if (workloadMatch) {
      const splitAt = workloadMatch.index || 0;
      name = remaining.slice(0, splitAt).trim();
      teacher = remaining.slice(splitAt + workloadMatch[0].length).trim();
    }

    return {
      code: code || "",
      name: cleanTitle(name),
      workload,
      teacher: cleanPersonName(teacher),
      email: (email || "").toLowerCase(),
      period: period || "",
    };
  }).filter((item) => item.code && item.name);
}

function extractSchedule(fullText) {
  const normalizedText = normalizeSpacing(fullText).replace(
    /Universidade Federal do Tri[aâ]ngulo Mineiro.+?P[aá]gina\s+\d+\/\d+/gi,
    " "
  );
  const sections = {};
  const sectionPattern = /Dia da Semana:\s*(Segunda|Terça|Terca|Quarta|Quinta|Sexta)\s+Per[ií]odo\s+Turma\s+Disciplina\s+Hor[aá]rio\s+Docente\s+(.+?)(?=Dia da Semana:\s*(?:Segunda|Terça|Terca|Quarta|Quinta|Sexta)\s+Per[ií]odo\s+Turma\s+Disciplina\s+Hor[aá]rio\s+Docente|$)/gi;

  for (const match of normalizedText.matchAll(sectionPattern)) {
    const dayKey = toDayKey(match[1]);
    if (!dayKey) {
      continue;
    }
    sections[dayKey] = normalizeSpacing(match[2] || "");
  }

  const entries = [];
  for (const dayKey of DAY_ORDER) {
    const joined = normalizeSpacing(sections[dayKey] || "");
    if (!joined) {
      continue;
    }

    const pattern = /(\d{2}\/\d{2}\/\d{4}(?:\s*-\s*\d{2}\/\d{2}\/\d{4})?)\s+([A-Z]{1,3}\d{1,2})\s+(.+?)\s+(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\s+([A-ZÀ-ÚÇÃÕ.\- ]+?)(?=(?:\d{2}\/\d{2}\/\d{4}(?:\s*-\s*\d{2}\/\d{2}\/\d{4})?\s+[A-Z]{1,3}\d{1,2})|$)/g;
    for (const match of joined.matchAll(pattern)) {
      const dateRange = match[1];
      const group = match[2];
      const title = cleanTitle(match[3]);
      const time = normalizeSpacing(match[4]);
      const teacher = cleanPersonName(match[5] || "");
      const [startDate, endDate] = splitDateRange(dateRange);
      const [startTime, endTime] = time.split(/\s*-\s*/);

      entries.push({
        id: [dayKey, group, title, startDate, startTime].join("-"),
        day: DAY_LABELS[dayKey],
        weekday: DAY_TO_WEEKDAY[dayKey],
        startDate,
        endDate,
        group,
        title,
        startTime,
        endTime,
        teacher,
        type: inferClassType(group),
      });
    }
  }

  return uniqueBy(entries, (item) => item.id).sort((left, right) => {
    if (left.weekday !== right.weekday) {
      return left.weekday - right.weekday;
    }
    return left.startTime.localeCompare(right.startTime);
  });
}

function splitBeforeWeekSchedule(text) {
  const index = text.search(/\bSegunda\b|\bTerça\b|\bTerca\b|\bQuarta\b|\bQuinta\b|\bSexta\b/i);
  return index >= 0 ? text.slice(0, index) : text;
}

function buildDisciplinesFromSchedule(schedule) {
  return uniqueBy(schedule, (item) => item.title).map((item) => ({
    code: "",
    name: item.title,
    workload: "",
    teacher: item.teacher,
    email: "",
    period: `${isoToBr(item.startDate)} - ${isoToBr(item.endDate)}`,
  }));
}

function splitDateRange(value) {
  const parts = String(value || "").split(/\s*-\s*/).map((item) => item.trim()).filter(Boolean);
  if (parts.length === 1) {
    const iso = brToIso(parts[0]);
    return [iso, iso];
  }
  return [brToIso(parts[0]), brToIso(parts[1])];
}

function brToIso(value) {
  const [day, month, year] = String(value || "").split("/");
  return day && month && year ? `${year}-${month}-${day}` : "";
}

function isoToBr(value) {
  const [year, month, day] = String(value || "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
}

function toDayKey(value) {
  const normalized = normalizeKey(value);
  return DAY_ORDER.includes(normalized) ? normalized : "";
}

function inferClassType(group) {
  if (/^T/i.test(group)) return "Teórica";
  if (/^P/i.test(group)) return "Prática";
  if (/^V/i.test(group)) return "Vivência";
  return "Aula";
}

function cleanTitle(value) {
  return normalizeSpacing(String(value || "").replace(/^\-\s*/, "").replace(/\bDOCENTE\b.*$/i, ""));
}

function cleanPersonName(value) {
  return normalizeSpacing(String(value || "").replace(/[()]/g, "").replace(/\bE-?MAIL\b.*$/i, ""));
}

function pickFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeSpacing(match[1]);
    }
  }
  return "";
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeSpacing(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}
