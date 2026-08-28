import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? htmlFiles(path.join(directory, entry.name)) : entry.name === "index.html" ? [path.join(directory, entry.name)] : [],
  );
}

const turkishUi = /(İçindekiler|Araç|Teklif|Kiralama|Gönder|İletişim|Anasayfa|Çerez|Gizlilik|Şirket|E-posta|Yakıt|Vites|KDV hariç|aylık)/i;
let issueCount = 0;
for (const file of htmlFiles(path.join(process.cwd(), "out", "en"))) {
  const visible = readFileSync(file, "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ");
  const match = visible.match(turkishUi);
  if (match) {
    issueCount += 1;
    const start = Math.max(0, match.index - 70);
    console.log(`${path.relative(process.cwd(), file)}: ${visible.slice(start, start + 220)}`);
  }
}
if (issueCount) process.exitCode = 1;
else console.log("English static output contains no audited Turkish UI terms.");
