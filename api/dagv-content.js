const { getDagvContent } = require("../dagv-wordpress");

module.exports = async function handler(request, response) {
  if (request.method && request.method !== "GET") {
    response.statusCode = 405;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ success: false, message: "Method not allowed" }));
    return;
  }

  try {
    const tab = resolveTab(request);
    const payload = await getDagvContent(tab);

    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(JSON.stringify({ success: true, ...payload }));
  } catch (error) {
    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(
      JSON.stringify({
        success: false,
        message: "não consegui carregar o conteúdo do DAGV agora",
      }),
    );
  }
};

function resolveTab(request) {
  if (request?.query?.tab) {
    return String(request.query.tab);
  }

  try {
    const url = new URL(request.url || "/", "http://localhost");
    return url.searchParams.get("tab") || "home";
  } catch (error) {
    return "home";
  }
}
