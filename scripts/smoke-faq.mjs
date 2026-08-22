import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repositoryRoot, "out");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "kalite-filo-faq-qa-"));
const edgePath = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find(existsSync);

if (!edgePath) throw new Error("Microsoft Edge was not found for FAQ QA.");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function resolveOutputPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://local").pathname);
  const candidate = path.resolve(
    outputRoot,
    pathname === "/" ? "index.html" : pathname.slice(1),
  );
  if (!candidate.startsWith(`${outputRoot}${path.sep}`) && candidate !== outputRoot) {
    return undefined;
  }
  return existsSync(candidate) && statSync(candidate).isDirectory()
    ? path.join(candidate, "index.html")
    : candidate;
}

const server = createServer((request, response) => {
  const outputPath = resolveOutputPath(request.url ?? "/");
  if (!outputPath || !existsSync(outputPath) || !statSync(outputPath).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes.get(path.extname(outputPath)) ?? "application/octet-stream",
  });
  createReadStream(outputPath).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const serverAddress = server.address();
if (!serverAddress || typeof serverAddress === "string") throw new Error("FAQ QA server failed.");

const probe = createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const probeAddress = probe.address();
if (!probeAddress || typeof probeAddress === "string") throw new Error("FAQ QA port failed.");
const debuggerPort = probeAddress.port;
await new Promise((resolve) => probe.close(resolve));

const edge = spawn(
  edgePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--remote-debugging-port=${debuggerPort}`,
    `--user-data-dir=${path.join(temporaryRoot, "profile")}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

try {
  let targets;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggerPort}/json`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) {
        targets = await response.json();
        break;
      }
    } catch {
      await delay(100);
    }
  }
  const page = targets?.find((target) => target.type === "page");
  if (!page) throw new Error("Edge did not expose a FAQ page target.");

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await Promise.race([
    new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    delay(10_000).then(() => Promise.reject(new Error("FAQ QA socket timed out."))),
  ]);
  let nextId = 1;
  const pending = new Map();
  const events = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const callback = pending.get(message.id);
      if (callback) {
        pending.delete(message.id);
        if (message.error) {
          callback.reject(new Error(message.error.message));
        } else {
          callback.resolve(message.result);
        }
      }
      return;
    }
    events.get(message.method)?.shift()?.(message.params);
  });
  const send = (method, params = {}) => {
    const id = nextId++;
    socket.send(JSON.stringify({ id, method, params }));
    return Promise.race([
      new Promise((resolve, reject) => pending.set(id, { reject, resolve })),
      delay(20_000).then(() => {
        pending.delete(id);
        throw new Error(`FAQ QA command timed out: ${method}`);
      }),
    ]);
  };
  const once = (method) => new Promise((resolve) => {
    const waiters = events.get(method) ?? [];
    waiters.push(resolve);
    events.set(method, waiters);
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error("FAQ browser evaluation failed.");
    return result.result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  const reports = [];
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: width < 768 ? 900 : 1100,
      mobile: width < 768,
      width,
    });
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", {
      url: `http://127.0.0.1:${serverAddress.port}/sikca-sorulan-sorular/`,
    });
    await Promise.race([loaded, delay(20_000).then(() => Promise.reject(new Error("FAQ load timed out.")))]);
    await delay(300);
    reports.push(await evaluate(`(async () => {
      const getDetails = () => [...document.querySelectorAll('main [data-faq-item="true"]')];
      const getControls = () => [...document.querySelectorAll('[data-faq-category-control="true"]')];
      const selectCategory = async (categoryId) => {
        const control = getControls().find(
          (candidate) => candidate.dataset.faqCategoryId === categoryId,
        );
        control?.click();
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          categoryId,
          count: getDetails().length,
          selected: getControls().filter(
            (candidate) => candidate.getAttribute('aria-pressed') === 'true',
          ).map((candidate) => candidate.dataset.faqCategoryId),
          visibleCategories: [...new Set(
            getDetails().map((detail) => detail.dataset.faqCategoryId),
          )],
        };
      };
      const initialDetails = getDetails();
      const initialFirstOpen = initialDetails[0]?.open === true;
      const filtered = [];
      for (const categoryId of [
        'kiralama-sureci',
        'arac-cozumleri',
        'bakim-ve-servis',
        'hasar-ve-kaza',
        'all',
      ]) {
        filtered.push(await selectCategory(categoryId));
      }
      const details = getDetails();
      details[1]?.querySelector('summary')?.click();
      const editorialSection = document
        .querySelector('#editorial-preview-title')
        ?.closest('section');
      const editorialCards = editorialSection
        ? [...editorialSection.querySelectorAll('ul > li')]
        : [];
      const editorialRows = new Set(
        editorialCards.map((card) => Math.round(card.getBoundingClientRect().top)),
      ).size;
      return {
        width: ${width},
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        h1: document.querySelectorAll('main h1').length,
        details: details.length,
        initialFirstOpen,
        secondOpened: details[1]?.open === true,
        categories: getControls().length,
        filtered,
        hash: location.hash,
        contact: document.querySelectorAll('[data-faq-contact] a[href="/iletisim/"]').length,
        editorialCards: editorialCards.length,
        editorialSingleRow: ${width} < 1280 || editorialRows === 1,
        currentNav: document.querySelectorAll('header a[href="/sikca-sorulan-sorular/"][aria-current="page"]').length,
        remote: performance.getEntriesByType('resource').map((entry) => entry.name)
          .filter((url) => !url.startsWith(location.origin) && !url.startsWith('data:')),
      };
    })()`));
  }
  for (const report of reports) {
    const expectedFilters = [
      ['kiralama-sureci', 2],
      ['arac-cozumleri', 2],
      ['bakim-ve-servis', 1],
      ['hasar-ve-kaza', 1],
      ['all', 6],
    ];
    const filtersAreCorrect = expectedFilters.every(
      ([categoryId, count], index) => {
        const filtered = report.filtered[index];
        return (
          filtered?.categoryId === categoryId &&
          filtered.count === count &&
          filtered.selected.length === 1 &&
          filtered.selected[0] === categoryId &&
          (categoryId === 'all' ||
            (filtered.visibleCategories.length === 1 &&
              filtered.visibleCategories[0] === categoryId))
        );
      },
    );
    if (
      report.overflow || report.h1 !== 1 || report.details !== 6 ||
      !report.initialFirstOpen || !report.secondOpened || report.categories !== 5 ||
      !filtersAreCorrect || report.hash !== '' || report.contact !== 1 ||
      report.editorialCards !== 4 || !report.editorialSingleRow || report.currentNav !== 2 ||
      report.remote.length !== 0
    ) {
      throw new Error(`FAQ browser QA failed: ${JSON.stringify(report)}`);
    }
  }
  console.log(`FAQ browser smoke passed: ${JSON.stringify(reports)}`);
  socket.close();
} finally {
  server.close();
  edge.kill();
  if (edge.pid) spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  await delay(300);
  rmSync(temporaryRoot, { force: true, recursive: true });
}
