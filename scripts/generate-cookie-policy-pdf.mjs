import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const markdown = readFileSync(path.join(root, "src/content/legal/cookie-policy-en.md"), "utf8").replace(/^---[\s\S]*?---\s*/, "");
const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const inline = (value) => escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="link">$1 ($2)</span>');
const lines = markdown.split(/\r?\n/);
const output = [];
let listOpen = false;
for (const raw of lines) {
  const line = raw.trim();
  if (!line) { if (listOpen) { output.push("</ul>"); listOpen = false; } continue; }
  if (line.startsWith("# ")) output.push(`<h1>${inline(line.slice(2))}</h1>`);
  else if (line.startsWith("## ")) output.push(`<h2>${inline(line.slice(3))}</h2>`);
  else if (line.startsWith("### ")) output.push(`<h3>${inline(line.slice(4))}</h3>`);
  else if (/^[-*] /.test(line)) { if (!listOpen) { output.push("<ul>"); listOpen = true; } output.push(`<li>${inline(line.slice(2))}</li>`); }
  else if (!line.startsWith("|")) output.push(`<p>${inline(line)}</p>`);
}
if (listOpen) output.push("</ul>");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kalite Filo Cookie Policy</title><style>@page{size:A4;margin:18mm 17mm 20mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:10.5pt;line-height:1.55;margin:0}h1{font-family:Georgia,serif;font-size:21pt;line-height:1.2;margin:0 0 18pt;border-bottom:1px solid #222;padding-bottom:10pt}h2{font-family:Georgia,serif;font-size:14pt;line-height:1.3;margin:19pt 0 7pt;break-after:avoid}h3{font-size:11.5pt;margin:13pt 0 5pt;break-after:avoid}p{margin:0 0 8pt}ul{margin:0 0 9pt;padding-left:18pt}li{margin:0 0 4pt}code{font-family:Arial,sans-serif;background:#eee;padding:1pt 3pt}.link{overflow-wrap:anywhere}footer{position:fixed;bottom:-12mm;left:0;right:0;text-align:center;font-size:8pt;color:#555}</style></head><body>${output.join("\n")}<footer>Kalite Filo — Cookie Policy</footer></body></html>`;
writeFileSync(path.join(root, ".cookie-policy-en.html"), html, "utf8");
