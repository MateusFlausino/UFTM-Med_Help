const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "node_modules", "pdfjs-dist", "legacy", "build");
const targetDir = path.join(root, "vendor", "pdfjs");
const files = ["pdf.mjs", "pdf.worker.mjs"];

if (!fs.existsSync(sourceDir)) {
  console.warn("pdfjs-dist não foi encontrado; nada para copiar.");
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`Arquivo ausente em pdfjs-dist: ${file}`);
    continue;
  }

  fs.copyFileSync(sourcePath, targetPath);
}

console.log("Ativos locais do PDF preparados em vendor/pdfjs.");
