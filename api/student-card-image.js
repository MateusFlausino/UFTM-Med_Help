module.exports = async function handler(request, response) {
  if (request.method && request.method !== "GET") {
    response.statusCode = 405;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ success: false, message: "Method not allowed" }));
    return;
  }

  const remoteUrl = resolveRemoteUrl(request);
  if (!remoteUrl || !isAllowedStudentCardUrl(remoteUrl)) {
    response.statusCode = 400;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ success: false, message: "URL inválida para a carteirinha" }));
    return;
  }

  try {
    const upstream = await fetch(remoteUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "Agenda-DAGV/1.0",
      },
    });

    if (!upstream.ok) {
      throw new Error(`upstream ${upstream.status}`);
    }

    const contentType = String(upstream.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new Error("conteúdo remoto não é imagem");
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    response.statusCode = 200;
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "no-store");
    response.end(buffer);
  } catch (error) {
    response.statusCode = 502;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(JSON.stringify({ success: false, message: "não consegui carregar a imagem da carteirinha agora" }));
  }
};

function resolveRemoteUrl(request) {
  if (request?.query?.url) {
    return normalizeStudentCardUrl(request.query.url);
  }

  try {
    const url = new URL(request.url || "/", "http://localhost");
    return normalizeStudentCardUrl(url.searchParams.get("url") || "");
  } catch (error) {
    return "";
  }
}

function normalizeStudentCardUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed).toString();
  } catch (error) {
    return "";
  }
}

function isAllowedStudentCardUrl(value) {
  try {
    const url = new URL(String(value || ""));
    const hostname = String(url.hostname || "").toLowerCase();
    return url.protocol === "https:" && (hostname === "uftm.edu.br" || hostname.endsWith(".uftm.edu.br"));
  } catch (error) {
    return false;
  }
}
