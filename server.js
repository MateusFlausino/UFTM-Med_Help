const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const rootPath = path.resolve(root);
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' https://esm.sh",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://dagvmeduftm.wordpress.com https://*.wordpress.com https://*.wp.com https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "font-src 'self' data:",
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

const server = http.createServer((request, response) => {
  applySecurityHeaders(response);

  if ((request.url || "").startsWith("/api/dagv-content")) {
    handleApiRoute("./api/dagv-content", request, response);
    return;
  }

  if ((request.url || "").startsWith("/api/parse-sca")) {
    handleApiRoute("./api/parse-sca", request, response);
    return;
  }

  if ((request.url || "").startsWith("/api/ru-abadia")) {
    handleApiRoute("./api/ru-abadia", request, response);
    return;
  }

  const requestUrl = request.url === "/" ? "/index.html" : request.url || "/index.html";
  const safePath = path.normalize(decodeURIComponent(requestUrl)).replace(/^(\.\.[/\\])+/, "");
  const relativePath = safePath.startsWith("/") ? `.${safePath}` : safePath;
  const filePath = path.resolve(root, relativePath);

  if (filePath !== rootPath && !filePath.startsWith(`${rootPath}${path.sep}`)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Acesso negado.");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Arquivo não encontrado.");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
});

async function handleApiRoute(modulePath, request, response) {
  try {
    const handler = require(modulePath);
    await handler(request, response);
  } catch (error) {
    response.writeHead(500, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ success: false, message: "não consegui concluir esta operação agora" }));
  }
}

function applySecurityHeaders(response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", cspDirectives.join("; "));
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), display-capture=()");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
}

server.listen(port, () => {
  console.log(`Agenda DAGV disponível em http://localhost:${port}`);
});
