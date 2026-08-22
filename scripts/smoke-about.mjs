import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repositoryRoot, "out");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "kalite-filo-about-qa-"));
const profileRoot = path.join(temporaryRoot, "edge-profile");
const edgePath = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find(existsSync);

if (!edgePath) throw new Error("Microsoft Edge was not found for the About smoke test.");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

function resolveOutputPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://local").pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const candidate = path.resolve(outputRoot, relativePath);
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
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes.get(path.extname(outputPath)) ?? "application/octet-stream",
  });
  createReadStream(outputPath).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const serverAddress = server.address();
if (!serverAddress || typeof serverAddress === "string") {
  throw new Error("The About static server did not expose a TCP port.");
}
const origin = `http://127.0.0.1:${serverAddress.port}`;

const debuggerProbe = createServer();
await new Promise((resolve) => debuggerProbe.listen(0, "127.0.0.1", resolve));
const debuggerAddress = debuggerProbe.address();
if (!debuggerAddress || typeof debuggerAddress === "string") {
  throw new Error("A debugger port could not be reserved.");
}
const debuggerPort = debuggerAddress.port;
await new Promise((resolve, reject) =>
  debuggerProbe.close((error) => (error ? reject(error) : resolve())),
);

const edge = spawn(
  edgePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debuggerPort}`,
    `--user-data-dir=${profileRoot}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggerPort}/json`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return response.json();
    } catch {
      // Edge may still be starting.
    }
    await delay(100);
  }
  throw new Error("Edge DevTools did not become available for About QA.");
}

try {
  const targets = await waitForDebugger();
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("Edge did not expose a page target.");

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await Promise.race([
    new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    delay(10_000).then(() => Promise.reject(new Error("CDP socket timed out."))),
  ]);

  let nextId = 1;
  const pending = new Map();
  const eventWaiters = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const callback = pending.get(message.id);
      if (callback) {
        pending.delete(message.id);
        if (message.error) callback.reject(new Error(message.error.message));
        else callback.resolve(message.result);
      }
      return;
    }
    const waiters = eventWaiters.get(message.method);
    if (waiters?.length) waiters.shift()(message.params);
  });

  function send(method, params = {}) {
    const id = nextId++;
    socket.send(JSON.stringify({ id, method, params }));
    return Promise.race([
      new Promise((resolve, reject) => pending.set(id, { reject, resolve })),
      delay(20_000).then(() => {
        pending.delete(id);
        throw new Error(`CDP command timed out: ${method}`);
      }),
    ]);
  }

  function once(method) {
    return new Promise((resolve) => {
      const waiters = eventWaiters.get(method) ?? [];
      waiters.push(resolve);
      eventWaiters.set(method, waiters);
    });
  }

  async function navigate(url) {
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url });
    await Promise.race([
      loaded,
      delay(20_000).then(() => Promise.reject(new Error("Page load timed out."))),
    ]);
    await delay(500);
  }

  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        `Browser evaluation failed: ${
          result.exceptionDetails.exception?.description ??
          result.exceptionDetails.text ??
          "unknown error"
        }`,
      );
    }
    return result.result.value;
  }

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
    await navigate(`${origin}/hakkimizda/`);
    await evaluate(`(async () => {
      for (let y = 0; y <= document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    })()`);
    const report = await evaluate(`(() => {
      const root = document.documentElement;
      const images = [...document.querySelectorAll('main img')];
      return {
        width: ${width},
        noHorizontalOverflow: root.scrollWidth === root.clientWidth,
        h1Count: document.querySelectorAll('main h1').length,
        mainCount: document.querySelectorAll('main').length,
        aboutSectionCount: document.querySelectorAll('[data-about-section]').length,
        heroControlCount: document.querySelectorAll(
          '[data-about-section="hero"] button[data-about-hero-control]'
        ).length,
        heroLinkCount: document.querySelectorAll('[data-about-section="hero"] a').length,
        visionMissionSectionCount: document.querySelectorAll(
          '[data-about-section="vision-mission-values"]'
        ).length,
        visionMissionCardCount: document.querySelectorAll(
          '[data-about-section="vision-mission-values"] article'
        ).length,
        valueCardCount: document.querySelectorAll(
          '[data-about-section="vision-mission-values"] li'
        ).length,
        visionMissionImageReady: (() => {
          const image = document.querySelector(
            'img[src="/images/about/volvo-xc90-vision-mission.png"]'
          );
          return image?.complete === true && image.naturalWidth === 1376;
        })(),
        currentAboutLinks: document.querySelectorAll(
          'header a[href="/hakkimizda/"][aria-current="page"]'
        ).length,
        localImagesReady:
          images.length >= 8 &&
          images.every((image) => image.getAttribute('src')?.startsWith('/images/')) &&
          images.slice(0, 2).every((image) => image.complete && image.naturalWidth > 0),
        approvedHeroFacts:
          document.querySelector('[data-about-statistic="vehicle-fleet"]')
            ?.innerText.includes('300+') === true &&
          document.querySelector('[data-about-statistic="customer-satisfaction"]')
            ?.innerText.includes('%98') === true,
        hasLegacyClaims: ['15k+', '1200+', '7/24'].some((claim) =>
          (document.querySelector('main')?.innerText ?? '').includes(claim)
        ),
        editorialActionDecoration: getComputedStyle(
          document.querySelector('#editorial-preview-title')
            .closest('section')
            .querySelector('a[href="/filo-rehberi/"]')
        ).textDecorationLine,
        externalResources: performance.getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((url) => !url.startsWith(location.origin) && !url.startsWith('data:')),
      };
    })()`);
    reports.push(report);
  }

  for (const report of reports) {
    if (
      !report.noHorizontalOverflow ||
      report.h1Count !== 1 ||
      report.mainCount !== 1 ||
      report.aboutSectionCount !== 5 ||
      report.heroControlCount !== 2 ||
      report.heroLinkCount !== 0 ||
      report.visionMissionSectionCount !== 1 ||
      report.visionMissionCardCount !== 2 ||
      report.valueCardCount !== 9 ||
      !report.visionMissionImageReady ||
      report.currentAboutLinks !== 2 ||
      !report.localImagesReady ||
      !report.approvedHeroFacts ||
      report.editorialActionDecoration !== 'none' ||
      report.externalResources.length !== 0 ||
      report.hasLegacyClaims
    ) {
      throw new Error(`About browser QA failed: ${JSON.stringify(report)}`);
    }
  }

  console.log(`About browser smoke passed: ${JSON.stringify(reports)}`);
  socket.close();
} finally {
  server.close();
  edge.kill();
  if (edge.pid) {
    spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
  }
  await delay(300);
  rmSync(temporaryRoot, {
    force: true,
    maxRetries: 5,
    recursive: true,
    retryDelay: 200,
  });
}
