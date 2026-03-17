module.exports = async function handler(request, response) {
  if (request.method && request.method !== "POST") {
    response.statusCode = 405;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ success: false, message: "Method not allowed" }));
    return;
  }

  try {
    const pdfBuffer = await readRequestBody(request);
    if (!pdfBuffer.length) {
      throw new Error("nenhum PDF foi enviado");
    }

    const [{ extractScaPdfDataFromArrayBuffer }, pdfjsLib] = await Promise.all([
      import("../sca-parser.js"),
      import("pdfjs-dist/legacy/build/pdf.mjs"),
    ]);

    const fallbackProfile = {
      displayName: decodeHeaderValue(request.headers["x-display-name"]),
      studentName: decodeHeaderValue(request.headers["x-student-name"]),
    };

    const academicData = await extractScaPdfDataFromArrayBuffer(pdfBuffer, fallbackProfile, { pdfjsLib });

    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ success: true, academicData }));
  } catch (error) {
    response.statusCode = 400;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({
        success: false,
        message: error?.message || "erro desconhecido ao processar o PDF",
      }),
    );
  }
};

function readRequestBody(request) {
  if (Buffer.isBuffer(request?.body)) {
    return Promise.resolve(request.body);
  }

  if (request?.body instanceof Uint8Array) {
    return Promise.resolve(Buffer.from(request.body));
  }

  if (request?.body instanceof ArrayBuffer) {
    return Promise.resolve(Buffer.from(request.body));
  }

  if (typeof request?.body === "string") {
    return Promise.resolve(Buffer.from(request.body, "binary"));
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", (error) => reject(error));
  });
}

function decodeHeaderValue(value) {
  if (!value) return "";

  try {
    return decodeURIComponent(String(Array.isArray(value) ? value[0] : value));
  } catch (error) {
    return String(Array.isArray(value) ? value[0] : value);
  }
}
