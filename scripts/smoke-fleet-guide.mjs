import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repositoryRoot, "out");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "kalite-filo-guide-qa-"));
const edgePath = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find(existsSync);

if (!edgePath) throw new Error("Microsoft Edge was not found for Filo Rehberi QA.");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
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
if (!serverAddress || typeof serverAddress === "string") throw new Error("QA server failed.");

const probe = createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const probeAddress = probe.address();
if (!probeAddress || typeof probeAddress === "string") throw new Error("QA port failed.");
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
  if (!page) throw new Error("Edge did not expose a page target.");

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await Promise.race([
    new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    delay(10_000).then(() => Promise.reject(new Error("QA socket timed out."))),
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
        throw new Error(`QA command timed out: ${method}`);
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
    if (result.exceptionDetails) throw new Error("Browser evaluation failed.");
    return result.result.value;
  };
  const navigate = async (pathname) => {
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", {
      url: `http://127.0.0.1:${serverAddress.port}${pathname}`,
    });
    await Promise.race([
      loaded,
      delay(20_000).then(() => Promise.reject(new Error("Page load timed out."))),
    ]);
    await delay(250);
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
      url: `http://127.0.0.1:${serverAddress.port}/filo-rehberi/`,
    });
    await Promise.race([
      loaded,
      delay(20_000).then(() => Promise.reject(new Error("Page load timed out."))),
    ]);
    await delay(250);
    reports.push(await evaluate(`(async () => {
      const controls = () => [...document.querySelectorAll('[data-fleet-guide-category-control="true"]')];
      const articles = () => [...document.querySelectorAll('[data-fleet-guide-article="true"]')];
      const paginationReports = [];
      for (const pageNumber of [2, 3, 1]) {
        window.scrollTo(0, document.documentElement.scrollHeight);
        document.querySelector('[data-fleet-guide-page-control="' + pageNumber + '"]')?.click();
        await new Promise((resolve) => setTimeout(resolve, 800));
        paginationReports.push({
          pageNumber,
          articles: articles().length,
          images: document.querySelectorAll('[data-fleet-guide-listing] img[src^="/images/filo-rehberi/"]').length,
          placeholders: document.querySelectorAll('[data-fleet-guide-cover-placeholder="true"]').length,
          current: document.querySelectorAll('[data-fleet-guide-page-control][aria-current="page"]')[0]?.dataset.fleetGuidePageControl,
          scrollY: Math.round(window.scrollY),
        });
      }
      document.querySelector('[data-fleet-guide-page-control="1"]')?.click();
      await new Promise((resolve) => setTimeout(resolve, 30));
      const listing = document.querySelector('[data-fleet-guide-listing="true"]');
      return {
        width: ${width},
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        h1: document.querySelectorAll('main h1').length,
        articles: articles().length,
        featured: document.querySelectorAll('[data-fleet-guide-featured="true"]').length,
        controls: controls().length,
        categoryHrefs: controls().map((control) => control.getAttribute('href')),
        selectedCategories: controls().filter((control) => control.getAttribute('aria-current') === 'page')
          .map((control) => control.dataset.fleetGuideCategoryId),
        articleHrefs: [...document.querySelectorAll('[data-fleet-guide-article-link="true"]')]
          .map((link) => link.getAttribute('href')),
        images: document.querySelectorAll('[data-fleet-guide-listing] img[src^="/images/filo-rehberi/"]').length,
        blogLabels: [...document.querySelectorAll('main *')].filter((node) => node.textContent?.trim() === 'Blog').length,
        currentNav: document.querySelectorAll('header a[href="/filo-rehberi/"][aria-current="page"]').length,
        pageCount: listing?.dataset.fleetGuidePageCount,
        pageSize: listing?.dataset.fleetGuidePageSize,
        recordCount: listing?.dataset.fleetGuideRecordCount,
        paginationReports,
        remote: performance.getEntriesByType('resource').map((entry) => entry.name)
          .filter((url) => !url.startsWith(location.origin) && !url.startsWith('data:')),
      };
    })()`));
  }

  for (const report of reports) {
    const categoriesWork = report.categoryHrefs.length === 7 &&
      report.categoryHrefs[0] === "/filo-rehberi/" &&
      report.categoryHrefs.slice(1).every((href) =>
        /^\/filo-rehberi\/[a-z0-9-]+\/$/.test(href)
      ) &&
      report.selectedCategories.length === 1 &&
      report.selectedCategories[0] === "all";
    const articleLinksWork = report.articleHrefs.length === 7 &&
      report.articleHrefs.every((href) =>
        /^\/filo-rehberi\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(href)
      );
    const expectedPages = new Map([
      [1, { articles: 7, images: 6, placeholders: 1 }],
      [2, { articles: 7, images: 1, placeholders: 6 }],
      [3, { articles: 6, images: 1, placeholders: 5 }],
    ]);
    const paginationWorks = report.paginationReports.length === 3 &&
      report.paginationReports.every((page) => {
        const expected = expectedPages.get(page.pageNumber);
        return expected && page.articles === expected.articles &&
          page.images === expected.images &&
          page.placeholders === expected.placeholders &&
          page.current === String(page.pageNumber) && page.scrollY <= 2;
      });
    if (
      report.overflow || report.h1 !== 1 || report.articles !== 7 ||
      report.featured !== 1 || report.controls !== 7 || report.images !== 6 ||
      report.blogLabels !== 0 || report.currentNav !== 2 || !categoriesWork ||
      !articleLinksWork ||
      !paginationWorks || report.pageCount !== "3" || report.pageSize !== "6" ||
      report.recordCount !== "18" ||
      report.remote.length !== 0
    ) {
      throw new Error(`Filo Rehberi browser QA failed: ${JSON.stringify(report)}`);
    }
  }

  await send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height: 1100,
    mobile: false,
    width: 1440,
  });
  await navigate("/filo-rehberi/uzun-donem-kiralama/");
  const categoryReport = await evaluate(`({
    pathname: location.pathname,
    h1: document.querySelectorAll('main h1').length,
    articles: document.querySelectorAll('[data-fleet-guide-article="true"]').length,
    selected: [...document.querySelectorAll('[data-fleet-guide-category-control="true"][aria-current="page"]')]
      .map((link) => link.dataset.fleetGuideCategoryId),
    articleHrefs: [...document.querySelectorAll('[data-fleet-guide-article-link="true"]')]
      .map((link) => link.getAttribute('href')),
    currentNav: document.querySelectorAll('header a[href="/filo-rehberi/"][aria-current="page"]').length,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  })`);
  if (
    categoryReport.pathname !== "/filo-rehberi/uzun-donem-kiralama/" ||
    categoryReport.h1 !== 1 || categoryReport.articles !== 3 ||
    categoryReport.selected.length !== 1 ||
    categoryReport.selected[0] !== "uzun-donem-kiralama" ||
    categoryReport.currentNav !== 2 || categoryReport.overflow ||
    categoryReport.articleHrefs.some(
      (href) => !href.startsWith("/filo-rehberi/uzun-donem-kiralama/"),
    )
  ) {
    throw new Error(`Filo Rehberi category QA failed: ${JSON.stringify(categoryReport)}`);
  }

  const detailPath = categoryReport.articleHrefs[0];
  await navigate(detailPath);
  const detailReport = await evaluate(`(async () => {
    const tocLinks = [...document.querySelectorAll('[data-article-toc-link="true"]')];
    const sectionIds = [...document.querySelectorAll('[data-article-section="true"]')]
      .map((heading) => heading.id);
    const firstTarget = tocLinks[0]
      ? document.querySelector(tocLinks[0].getAttribute('href'))
      : null;
    const headerMeta = document.querySelector('[data-article-header-meta="true"]');
    const cover = document.querySelector('[data-article-cover="true"]');
    const headerToCoverGap = headerMeta && cover
      ? Math.round(cover.getBoundingClientRect().top - headerMeta.getBoundingClientRect().bottom)
      : null;
    const shareTrigger = document.querySelector('button[aria-label="Makaleyi paylaş"]');
    shareTrigger?.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const shareDialog = document.querySelector('[data-article-share-dialog="true"]');
    const shareDialogOpen = shareDialog?.open === true;
    const shareXHref = shareDialog?.querySelector('[data-share-x="true"]')?.href ?? null;
    const shareWhatsAppHref = shareDialog?.querySelector('[data-share-whatsapp="true"]')?.href ?? null;
    shareDialog?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    const shareDialogClosedFromBackdrop = shareDialog?.open === false;
    document.querySelector('button[aria-label="Makale bağlantısını kopyala"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const copyStatus = document.querySelector('[data-article-share-actions="true"] [aria-live="polite"]')?.textContent?.trim() ?? null;
    tocLinks[0]?.click();
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      pathname: location.pathname,
      currentUrl: location.href,
      h1: document.querySelectorAll('main h1').length,
      content: document.querySelectorAll('[data-article-content="true"]').length,
      tocCount: document.querySelectorAll('[data-article-table-of-contents="true"]').length,
      headerMetaCount: document.querySelectorAll('[data-article-header-meta="true"]').length,
      shareCount: document.querySelectorAll('[data-article-share-actions="true"]').length,
      shareControls: document.querySelectorAll('[data-article-share-actions="true"] a, [data-article-share-actions="true"] button').length,
      shareDialogOpen,
      shareDialogClosedFromBackdrop,
      shareXHref,
      shareWhatsAppHref,
      copyStatus,
      ctaLinks: [...document.querySelectorAll('[data-article-cta-link="true"]')]
        .map((link) => link.getAttribute('href')),
      relatedHrefs: [...document.querySelectorAll('[data-article-related="true"]')]
        .map((link) => link.getAttribute('href')),
      formerInformationCard: Boolean(document.querySelector('#article-information-title')),
      headerToCoverGap,
      tocTargets: tocLinks.map((link) => link.getAttribute('href')?.slice(1)),
      sectionIds,
      hash: location.hash,
      firstTargetTop: firstTarget ? Math.round(firstTarget.getBoundingClientRect().top) : null,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      sourceScaffolding: document.querySelector('main')?.innerText.includes('İç Link Önerileri') ||
        document.querySelector('main')?.innerText.includes('/araclar/'),
      currentNav: document.querySelectorAll('header a[href="/filo-rehberi/"][aria-current="page"]').length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  })()`);
  if (
    detailReport.pathname !== detailPath || detailReport.h1 !== 1 ||
    detailReport.content !== 1 || detailReport.currentNav !== 2 ||
    detailReport.tocCount !== 1 || detailReport.tocTargets.length === 0 ||
    detailReport.headerMetaCount !== 1 || detailReport.shareCount !== 1 ||
    detailReport.shareControls !== 7 || !detailReport.shareDialogOpen ||
    !detailReport.shareDialogClosedFromBackdrop ||
    !detailReport.shareXHref?.startsWith('https://x.com/intent/tweet?') ||
    !detailReport.shareWhatsAppHref?.startsWith('https://api.whatsapp.com/send/?') ||
    new URL(detailReport.shareXHref).searchParams.get('url') !== detailReport.currentUrl ||
    !new URL(detailReport.shareWhatsAppHref).searchParams.get('text')?.includes(detailReport.currentUrl) ||
    detailReport.copyStatus !== 'Makale bağlantısı kopyalandı.' ||
    detailReport.ctaLinks.length === 0 ||
    detailReport.ctaLinks.some((href) => href !== '/arac-listesi/' && href !== '/teklif-al/') ||
    detailReport.relatedHrefs.length !== 1 ||
    !detailReport.relatedHrefs[0].match(/^\/filo-rehberi\/[a-z0-9-]+\/[a-z0-9-]+\/$/) ||
    detailReport.relatedHrefs[0] === detailPath || detailReport.formerInformationCard ||
    detailReport.headerToCoverGap === null || detailReport.headerToCoverGap < 20 ||
    detailReport.headerToCoverGap > 48 ||
    JSON.stringify(detailReport.tocTargets) !== JSON.stringify(detailReport.sectionIds) ||
    detailReport.hash !== `#${detailReport.tocTargets[0]}` ||
    detailReport.firstTargetTop === null || detailReport.firstTargetTop < 70 ||
    detailReport.firstTargetTop > 180 || detailReport.scrollBehavior !== "smooth" ||
    detailReport.sourceScaffolding || detailReport.overflow
  ) {
    throw new Error(`Filo Rehberi detail QA failed: ${JSON.stringify(detailReport)}`);
  }
  console.log(`Filo Rehberi browser smoke passed: ${JSON.stringify(reports)}`);
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
  rmSync(temporaryRoot, { force: true, recursive: true });
}
