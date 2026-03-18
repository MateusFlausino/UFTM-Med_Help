const { getTodayAbadiaMenu } = require("../ru-abadia");

module.exports = async function handler(request, response) {
  if (request.method && request.method !== "GET") {
    response.statusCode = 405;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ success: false, message: "Method not allowed" }));
    return;
  }

  try {
    const menu = await getTodayAbadiaMenu();
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(JSON.stringify({ success: true, menu }));
  } catch (error) {
    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(
      JSON.stringify({
        success: false,
        message: "não consegui buscar o cardápio agora",
      })
    );
  }
};
