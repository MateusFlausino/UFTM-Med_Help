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
const PDFJS_WORKER_CANDIDATES = [
  new URL("./vendor/pdfjs/pdf.worker.mjs", import.meta.url).href,
  new URL("./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).href,
];
let pdfjsModulePromise = null;

export async function extractScaPdfData(file, fallbackProfile = {}, options = {}) {
  const buffer = await file.arrayBuffer();
  return extractScaPdfDataFromArrayBuffer(buffer, fallbackProfile, options);
}

export async function extractScaPdfDataFromArrayBuffer(buffer, fallbackProfile = {}, options = {}) {
  const pdfjsLib = options.pdfjsLib || await loadPdfJs();
  preparePdfJsModule(pdfjsLib, options.pdfjsSourceIndex);
  const loadingTask = pdfjsLib.getDocument({
    data: toPdfBinary(buffer),
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
    ensurePdfJsCompatibility();
    pdfjsModulePromise = loadLocalPdfJs().catch((error) => {
      pdfjsModulePromise = null;
      throw new Error(`não consegui carregar o leitor de PDF necessário para importar este arquivo (${describeLoadError(error)})`);
    });
  }
  return pdfjsModulePromise;
}

async function loadLocalPdfJs() {
  for (let index = 0; index < PDFJS_IMPORT_CANDIDATES.length; index += 1) {
    const candidate = PDFJS_IMPORT_CANDIDATES[index];
    try {
      const module = await import(candidate);
      preparePdfJsModule(module, index);
      return module;
    } catch (error) {
      // tenta o próximo caminho local disponível
    }
  }

  throw new Error("pdf.js indisponível");
}

function describeLoadError(error) {
  const message = String(error?.message || error || "").trim();
  return message || "erro desconhecido";
}

export function ensurePdfJsCompatibility() {
  if (typeof globalThis.DOMMatrix !== "function") {
    globalThis.DOMMatrix = SimpleDOMMatrix;
  }

  if (typeof globalThis.DOMMatrixReadOnly !== "function") {
    globalThis.DOMMatrixReadOnly = SimpleDOMMatrix;
  }
}

export function preparePdfJsModule(pdfjsLib, sourceIndex = 0) {
  ensurePdfJsCompatibility();

  if (!pdfjsLib?.GlobalWorkerOptions) {
    return pdfjsLib;
  }

  const workerSrc = PDFJS_WORKER_CANDIDATES[sourceIndex] || PDFJS_WORKER_CANDIDATES[0] || "";
  if (workerSrc && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }

  return pdfjsLib;
}

class SimpleDOMMatrix {
  static fromMatrix(init) {
    return new SimpleDOMMatrix(init);
  }

  constructor(init) {
    const values = normalizeMatrixInit(init);
    this._set(values.a, values.b, values.c, values.d, values.e, values.f);
  }

  multiply(other) {
    return new SimpleDOMMatrix(this).multiplySelf(other);
  }

  multiplySelf(other) {
    const matrix = normalizeMatrixInit(other);
    const next = multiply2d(this, matrix);
    this._set(next.a, next.b, next.c, next.d, next.e, next.f);
    return this;
  }

  preMultiply(other) {
    return new SimpleDOMMatrix(this).preMultiplySelf(other);
  }

  preMultiplySelf(other) {
    const matrix = normalizeMatrixInit(other);
    const next = multiply2d(matrix, this);
    this._set(next.a, next.b, next.c, next.d, next.e, next.f);
    return this;
  }

  translate(tx = 0, ty = 0) {
    return this.multiplySelf([1, 0, 0, 1, tx, ty]);
  }

  translateSelf(tx = 0, ty = 0) {
    return this.translate(tx, ty);
  }

  scale(scaleX = 1, scaleY = scaleX, scaleZ = 1, originX = 0, originY = 0) {
    if (originX || originY) {
      this.translate(originX, originY);
    }

    this.multiplySelf([scaleX, 0, 0, scaleY, 0, 0]);

    if (originX || originY) {
      this.translate(-originX, -originY);
    }

    return this;
  }

  scaleSelf(scaleX = 1, scaleY = scaleX, scaleZ = 1, originX = 0, originY = 0) {
    return this.scale(scaleX, scaleY, scaleZ, originX, originY);
  }

  inverse() {
    return new SimpleDOMMatrix(this).invertSelf();
  }

  invertSelf() {
    const determinant = this.a * this.d - this.b * this.c;
    if (!determinant) {
      this._set(NaN, NaN, NaN, NaN, NaN, NaN);
      return this;
    }

    const next = {
      a: this.d / determinant,
      b: -this.b / determinant,
      c: -this.c / determinant,
      d: this.a / determinant,
      e: (this.c * this.f - this.d * this.e) / determinant,
      f: (this.b * this.e - this.a * this.f) / determinant,
    };

    this._set(next.a, next.b, next.c, next.d, next.e, next.f);
    return this;
  }

  transformPoint(point = {}) {
    const x = Number(point.x || 0);
    const y = Number(point.y || 0);
    const z = Number(point.z || 0);
    const w = Number(point.w || 1);

    return {
      x: x * this.a + y * this.c + this.e,
      y: x * this.b + y * this.d + this.f,
      z,
      w,
    };
  }

  toFloat64Array() {
    return new Float64Array([
      this.m11, this.m12, this.m13, this.m14,
      this.m21, this.m22, this.m23, this.m24,
      this.m31, this.m32, this.m33, this.m34,
      this.m41, this.m42, this.m43, this.m44,
    ]);
  }

  _set(a, b, c, d, e, f) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    this.m11 = a;
    this.m12 = b;
    this.m13 = 0;
    this.m14 = 0;
    this.m21 = c;
    this.m22 = d;
    this.m23 = 0;
    this.m24 = 0;
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
    this.m34 = 0;
    this.m41 = e;
    this.m42 = f;
    this.m43 = 0;
    this.m44 = 1;
    this.is2D = true;
    this.isIdentity = a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0;
  }
}

function normalizeMatrixInit(init) {
  if (init instanceof SimpleDOMMatrix) {
    return init;
  }

  if (Array.isArray(init) || ArrayBuffer.isView(init)) {
    const values = Array.from(init);
    if (values.length >= 6) {
      return {
        a: Number(values[0] ?? 1),
        b: Number(values[1] ?? 0),
        c: Number(values[2] ?? 0),
        d: Number(values[3] ?? 1),
        e: Number(values[4] ?? 0),
        f: Number(values[5] ?? 0),
      };
    }
  }

  if (init && typeof init === "object") {
    return {
      a: Number(init.a ?? init.m11 ?? 1),
      b: Number(init.b ?? init.m12 ?? 0),
      c: Number(init.c ?? init.m21 ?? 0),
      d: Number(init.d ?? init.m22 ?? 1),
      e: Number(init.e ?? init.m41 ?? 0),
      f: Number(init.f ?? init.m42 ?? 0),
    };
  }

  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

function multiply2d(left, right) {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  };
}

function toPdfBinary(buffer) {
  if (buffer instanceof Uint8Array) {
    return new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  }

  if (buffer instanceof ArrayBuffer) {
    return new Uint8Array(buffer);
  }

  return new Uint8Array(buffer || []);
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
