import { spawn, spawnSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputRoot = path.join(repositoryRoot, "out");
const screenshotMode = process.argv.includes("--screenshots");
const priceSource = JSON.parse(
  readFileSync(
    path.join(repositoryRoot, "src", "data", "vehicle-list-prices.json"),
    "utf8",
  ),
);
const expectedPricesTry = Object.fromEntries(
  Object.entries(priceSource.amountsMinor).map(([sourceId, amountMinor]) => [
    sourceId,
    amountMinor / 100,
  ]),
);
const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "kalite-filo-vehicles-qa-"),
);
const profileRoot = path.join(temporaryRoot, "edge-profile");

const robotsText = readFileSync(path.join(outputRoot, "robots.txt"), "utf8");
const sitemapText = readFileSync(path.join(outputRoot, "sitemap.xml"), "utf8");
const deployOrigin = robotsText.includes("https://staging.kalitefilo.com.tr")
  ? "https://staging.kalitefilo.com.tr"
  : robotsText.includes("https://kalitefilo.com.tr")
    ? "https://kalitefilo.com.tr"
    : undefined;

if (!deployOrigin) {
  throw new Error("Unable to infer the vehicle smoke-test deployment target.");
}

if ((sitemapText.match(/<loc>/g) ?? []).length !== 0) {
  throw new Error("The unpublished vehicle catalogue must not enter sitemap.xml.");
}

const edgeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const edgePath = edgeCandidates.find(existsSync);

if (!edgePath) {
  throw new Error("Microsoft Edge was not found for the vehicle smoke test.");
}

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

function resolveOutputPath(requestUrl) {
  const pathname = decodeURIComponent(
    new URL(requestUrl, "http://local").pathname,
  );
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const candidate = path.resolve(outputRoot, relativePath);

  if (
    !candidate.startsWith(`${outputRoot}${path.sep}`) &&
    candidate !== outputRoot
  ) {
    return undefined;
  }

  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return path.join(candidate, "index.html");
  }

  return candidate;
}

const server = createServer((request, response) => {
  const outputPath = resolveOutputPath(request.url ?? "/");

  if (!outputPath || !existsSync(outputPath) || !statSync(outputPath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type":
      contentTypes.get(path.extname(outputPath)) ?? "application/octet-stream",
  });
  createReadStream(outputPath).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const serverAddress = server.address();

if (!serverAddress || typeof serverAddress === "string") {
  throw new Error("The local static server did not expose a TCP port.");
}

const origin = `http://127.0.0.1:${serverAddress.port}`;
const edge = spawn(
  edgePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileRoot}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDebugger() {
  const activePortPath = path.join(profileRoot, "DevToolsActivePort");
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const debuggerPort = existsSync(activePortPath)
        ? Number(readFileSync(activePortPath, "utf8").split(/\r?\n/, 1)[0])
        : undefined;
      if (!debuggerPort) {
        await delay(100);
        continue;
      }
      const response = await fetch(`http://127.0.0.1:${debuggerPort}/json`);
      if (response.ok) return response.json();
    } catch {
      // Edge may still be starting.
    }
    await delay(100);
  }
  throw new Error("Edge DevTools did not become available.");
}

try {
  const targets = await waitForDebugger();
  const page = targets.find((target) => target.type === "page");

  if (!page) {
    throw new Error("Edge did not expose a page target.");
  }

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("The Edge DevTools WebSocket timed out.")),
      10_000,
    );
    socket.addEventListener(
      "open",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
    socket.addEventListener(
      "error",
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
      { once: true },
    );
  });

  let nextId = 1;
  const pending = new Map();
  const eventWaiters = new Map();

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const callback = pending.get(message.id);
      if (callback) {
        pending.delete(message.id);
        clearTimeout(callback.timeout);
        if (message.error) callback.reject(new Error(message.error.message));
        else callback.resolve(message.result);
      }
      return;
    }

    const waiters = eventWaiters.get(message.method);
    if (waiters?.length) {
      const waiter = waiters.shift();
      clearTimeout(waiter.timeout);
      waiter.resolve(message.params);
    }
  });

  function send(method, params = {}, timeoutMilliseconds = 20_000) {
    const id = nextId;
    nextId += 1;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, timeoutMilliseconds);
      pending.set(id, { reject, resolve, timeout });
    });
  }

  function once(method, timeoutMilliseconds = 20_000) {
    return new Promise((resolve, reject) => {
      const waiters = eventWaiters.get(method) ?? [];
      const waiter = { resolve, timeout: undefined };
      waiter.timeout = setTimeout(() => {
        const activeWaiters = eventWaiters.get(method) ?? [];
        const index = activeWaiters.indexOf(waiter);
        if (index >= 0) activeWaiters.splice(index, 1);
        reject(new Error(`CDP event timed out: ${method}`));
      }, timeoutMilliseconds);
      waiters.push(waiter);
      eventWaiters.set(method, waiters);
    });
  }

  async function navigate(url) {
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url });
    await loaded;
    await delay(1000);
  }

  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
    });
    return result.result.value;
  }

  async function setViewport(width) {
    await send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: width <= 390 ? 900 : 1100,
      mobile: width < 768,
      width,
    });
  }

  async function selectFilter(selector, value) {
    const changed = await evaluate(`(() => {
      const select = document.querySelector(${JSON.stringify(selector)});
      if (!select) return false;
      select.value = ${JSON.stringify(value)};
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);

    if (!changed) {
      throw new Error(`Vehicle filter control was not found: ${selector}`);
    }
    await delay(750);
  }

  await send("Page.enable");
  await send("Runtime.enable");

  const responsiveReports = [];
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await setViewport(width);
    await navigate(`${origin}/arac-listesi/`);

    if (width < 1024) {
      await evaluate(`(() => {
        const disclosure = document.querySelector('main details');
        if (disclosure) disclosure.open = true;
      })()`);
    }

    const report = await evaluate(`(() => {
      const root = document.documentElement;
      const main = document.querySelector('main');
      const desktopFilter = document.querySelector(
        'aside[aria-labelledby="desktop-vehicle-filters-title"]'
      );
      const mobileFilter = document.querySelector('main details');
      const imageSources = [...document.querySelectorAll(
        '[data-vehicle-card] img[src^="/images/vehicles/"]'
      )].map((image) => image.getAttribute('src'));
      const bodyText = document.body.innerText;
      const vehicleCards = [...(main?.querySelectorAll('[data-vehicle-card]') ?? [])];
      const renderedPricesTry = Object.fromEntries(vehicleCards.map((card) => [
        card.getAttribute('data-vehicle-source-id'),
        Number(card.getAttribute('data-monthly-list-net-price-try')),
      ]));
      return {
        viewport: ${width},
        noHorizontalOverflow: root.scrollWidth === root.clientWidth,
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        h1Count: main?.querySelectorAll('h1').length ?? 0,
        h1Text: main?.querySelector('h1')?.textContent.trim(),
        catalogueCount: main?.querySelectorAll('[data-vehicle-catalogue="true"]').length ?? 0,
        cardCount: main?.querySelectorAll('[data-vehicle-card]').length ?? 0,
        resultCount: Number(
          main?.querySelector('[data-vehicle-result-count]')
            ?.getAttribute('data-vehicle-result-count')
        ),
        imageCount: imageSources.length,
        uniqueImageCount: new Set(imageSources).size,
        missingImageCount: main?.querySelectorAll(
          '[data-vehicle-card] [role="img"][aria-label*="doğrulanmış araç görseli mevcut değil"]'
        ).length ?? 0,
        quoteCount: main?.querySelectorAll(
          '[data-vehicle-card] a[href="/teklif-al/"]'
        ).length ?? 0,
        fullCardLinkCount: vehicleCards.filter((card) =>
          card.querySelectorAll(
            ':scope > a[data-vehicle-card-link="true"][href="/teklif-al/"]'
          ).length === 1
        ).length,
        nestedCardLinkCount: vehicleCards.reduce((count, card) => {
          const link = card.querySelector(
            ':scope > a[data-vehicle-card-link="true"]'
          );
          return count + (link?.querySelectorAll('a').length ?? 0);
        }, 0),
        cardCtaCount: vehicleCards.filter((card) =>
          card.querySelectorAll('[data-vehicle-card-cta="true"]').length === 1
        ).length,
        cardCtaHoverCount: vehicleCards.filter((card) =>
          card.querySelector('[data-vehicle-card-cta="true"]')
            ?.classList.contains('group-hover:bg-orange-dark')
        ).length,
        renderedPricesTry,
        priceBlockCount: vehicleCards.filter((card) =>
          card.querySelector('[data-vehicle-list-price="true"]')
        ).length,
        monthlyListNetLabelCount: vehicleCards.filter((card) =>
          card.querySelector('[data-vehicle-list-price="true"]')
            ?.innerText.includes('Aylık Liste Net')
        ).length,
        vatExcludedLabelCount: vehicleCards.filter((card) =>
          card.querySelector('[data-vehicle-list-price="true"]')
            ?.innerText.includes('KDV hariç')
        ).length,
        validPricePresentationCount: vehicleCards.filter((card) => {
          const amountTry = Number(
            card.getAttribute('data-monthly-list-net-price-try')
          );
          const price = card.querySelector('[data-vehicle-list-price="true"]');
          const data = price?.querySelector('data');
          return Number(data?.value) === amountTry &&
            data?.innerText.startsWith('₺') &&
            price?.innerText.includes('/ay');
        }).length,
        factGroupCount: vehicleCards.filter((card) =>
          card.querySelector('[data-vehicle-facts="true"]')
        ).length,
        factItemCount: vehicleCards.reduce(
          (count, card) => count + card.querySelectorAll('[data-vehicle-fact]').length,
          0,
        ),
        cardsWithTwoFacts: vehicleCards.filter(
          (card) => card.querySelectorAll('[data-vehicle-fact]').length === 2
        ).length,
        factSingleRowLayoutCount: vehicleCards.filter(
          (card) => card.querySelector('[data-vehicle-facts="true"]')
            ?.getAttribute('data-vehicle-facts-layout') === 'single-row'
        ).length,
        cardsWithFactsStartingOnSingleRow: vehicleCards.filter((card) => {
          const facts = [...card.querySelectorAll('[data-vehicle-fact]')];
          const tops = facts.map((fact) => fact.getBoundingClientRect().top);
          return tops.length === 2 && Math.max(...tops) - Math.min(...tops) <= 1;
        }).length,
        validTransmissionDisplayCount: vehicleCards.filter((card) => {
          const transmission = card.querySelector(
            '[data-vehicle-fact="transmission"]'
          );
          const label = transmission?.getAttribute(
            'data-vehicle-transmission-display'
          );
          return ['Manuel', 'Otomatik', 'Yarı Otomatik'].includes(label) &&
            transmission?.innerText.includes(label);
        }).length,
        transmissionDisplayCounts: vehicleCards.reduce((counts, card) => {
          const label = card.querySelector('[data-vehicle-fact="transmission"]')
            ?.getAttribute('data-vehicle-transmission-display');
          if (label) counts[label] = (counts[label] ?? 0) + 1;
          return counts;
        }, {}),
        mediaGroupCount: vehicleCards.filter(
          (card) => card.querySelector('[data-vehicle-media="true"]')
        ).length,
        cardsWithCategoryBadgeText: vehicleCards.filter((card) => {
          const media = card.querySelector('[data-vehicle-media="true"]');
          return ['Binek', 'SUV', 'Ticari Araçlar']
            .some((label) => media?.innerText.includes(label));
        }).length,
        perCardCreditLinkCount: vehicleCards.reduce(
          (count, card) => count +
            card.querySelectorAll('[data-asset-credit="true"]').length,
          0,
        ),
        cardsWithPerCardCreditText: vehicleCards.filter(
          (card) => card.innerText.includes('Görsel:')
        ).length,
        imageCreditComponentCount: document.querySelectorAll(
          '[data-vehicle-image-credits="true"]'
        ).length,
        vehicleLicenseLedgerCount: document.querySelectorAll(
          'a[href="/images/vehicles/LICENSES.md"]'
        ).length,
        detailLinkCount: [...(main?.querySelectorAll('a[href^="/araclar/"]') ?? [])]
          .filter((link) => /^\\/araclar\\/[^?/#]+\\/?$/.test(
            new URL(link.href).pathname
          )).length,
        hasObsoleteQuoteOnlyPriceCopy: bodyText.includes('Fiyat için teklif alın'),
        robots: document.querySelector('meta[name="robots"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        desktopFilterVisible: desktopFilter
          ? desktopFilter.offsetParent !== null
          : false,
        mobileFilterVisible: mobileFilter
          ? mobileFilter.offsetParent !== null
          : false,
        mobileFilterOpen: mobileFilter?.open ?? false,
        mobileSummaryHeight: mobileFilter
          ? Math.round(mobileFilter.querySelector('summary')?.getBoundingClientRect().height ?? 0)
          : 0,
        filterNames: [...new Set(
          [...(main?.querySelectorAll('select[name]') ?? [])]
            .map((select) => select.name)
        )].sort(),
        remoteResources: performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((url) => !url.startsWith(location.origin) && !url.startsWith('data:')),
      };
    })()`);
    responsiveReports.push(report);

    if (screenshotMode && (width === 320 || width === 1440)) {
      const screenshot = await send("Page.captureScreenshot", {
        captureBeyondViewport: true,
        format: "png",
      });
      writeFileSync(
        path.join(temporaryRoot, `vehicles-${width}.png`),
        Buffer.from(screenshot.data, "base64"),
      );
    }
  }

  for (const report of responsiveReports) {
    const mobile = report.viewport < 1024;
    if (
      !report.noHorizontalOverflow ||
      report.h1Count !== 1 ||
      report.h1Text !== "Uzun Dönem Kiralık Araçlar" ||
      report.catalogueCount !== 1 ||
      report.cardCount !== 32 ||
      report.resultCount !== 32 ||
      report.imageCount !== 28 ||
      report.uniqueImageCount !== 28 ||
      report.missingImageCount !== 4 ||
      report.quoteCount !== 32 ||
      report.fullCardLinkCount !== 32 ||
      report.nestedCardLinkCount !== 0 ||
      report.cardCtaCount !== 32 ||
      report.cardCtaHoverCount !== 32 ||
      report.detailLinkCount !== 0 ||
      report.hasObsoleteQuoteOnlyPriceCopy ||
      report.priceBlockCount !== 32 ||
      report.monthlyListNetLabelCount !== 32 ||
      report.vatExcludedLabelCount !== 32 ||
      report.validPricePresentationCount !== 32 ||
      report.factGroupCount !== 32 ||
      report.factItemCount !== 64 ||
      report.cardsWithTwoFacts !== 32 ||
      report.factSingleRowLayoutCount !== 32 ||
      report.cardsWithFactsStartingOnSingleRow !== 32 ||
      report.validTransmissionDisplayCount !== 32 ||
      report.transmissionDisplayCounts.Otomatik !== 10 ||
      report.transmissionDisplayCounts['Yarı Otomatik'] !== 17 ||
      report.transmissionDisplayCounts.Manuel !== 5 ||
      report.mediaGroupCount !== 32 ||
      report.cardsWithCategoryBadgeText !== 0 ||
      report.perCardCreditLinkCount !== 0 ||
      report.cardsWithPerCardCreditText !== 0 ||
      report.imageCreditComponentCount !== 0 ||
      report.vehicleLicenseLedgerCount !== 0 ||
      Object.keys(report.renderedPricesTry).length !== 32 ||
      Object.entries(expectedPricesTry).some(
        ([sourceId, amountTry]) =>
          report.renderedPricesTry[sourceId] !== amountTry,
      ) ||
      !report.robots?.startsWith("noindex, nofollow") ||
      report.canonical !== `${deployOrigin}/arac-listesi/` ||
      report.filterNames.join(",") !== "marka,model,segment,vites,yakit" ||
      report.remoteResources.length !== 0 ||
      (mobile
        ? !report.mobileFilterVisible ||
          !report.mobileFilterOpen ||
          report.mobileSummaryHeight < 44 ||
          report.desktopFilterVisible
        : !report.desktopFilterVisible || report.mobileFilterVisible)
    ) {
      throw new Error(
        `Vehicle responsive smoke assertion failed: ${JSON.stringify(report)}`,
      );
    }
  }

  await setViewport(1440);
  await navigate(`${origin}/arac-listesi/`);
  await selectFilter("#desktop-vehicle-filter-make", "Renault");
  const renaultState = await evaluate(`(() => {
    const model = document.querySelector('#desktop-vehicle-filter-model');
    return {
      count: document.querySelectorAll('[data-vehicle-card]').length,
      query: location.search,
      modelDisabled: model?.disabled,
      modelOptions: [...(model?.options ?? [])].map((option) => option.value),
      headings: [...document.querySelectorAll('[data-vehicle-card] h3')]
        .map((heading) => heading.textContent.trim()),
    };
  })()`);

  await selectFilter("#desktop-vehicle-filter-model", "Clio");
  const clioState = await evaluate(`({
    count: document.querySelectorAll('[data-vehicle-card]').length,
    query: location.search,
    heading: document.querySelector('[data-vehicle-card] h3')?.textContent.trim(),
    priceTry: Number(document.querySelector('[data-vehicle-card]')
      ?.getAttribute('data-monthly-list-net-price-try')),
  })`);

  await navigate(`${origin}/arac-listesi/`);
  const clickedSuv = await evaluate(`(() => {
    const button = [...document.querySelectorAll(
      'button[aria-controls="vehicle-catalogue-results"]'
    )].find((candidate) => candidate.textContent.trim() === 'SUV');
    button?.click();
    return Boolean(button);
  })()`);
  await delay(1000);
  const suvState = await evaluate(`({
    count: document.querySelectorAll('[data-vehicle-card]').length,
    query: location.search,
    pressed: [...document.querySelectorAll('button[aria-controls="vehicle-catalogue-results"]')]
      .find((button) => button.textContent.trim() === 'SUV')?.getAttribute('aria-pressed'),
  })`);

  await navigate(`${origin}/arac-listesi/`);
  await selectFilter("#desktop-vehicle-filter-fuel", "Elektrik");
  const electricState = await evaluate(`({
    count: document.querySelectorAll('[data-vehicle-card]').length,
    query: location.search,
    headings: [...document.querySelectorAll('[data-vehicle-card] h3')]
      .map((heading) => heading.textContent.trim()).sort(),
  })`);

  await navigate(`${origin}/arac-listesi/?marka=Ford&model=Transit%20Van`);
  const exactQueryState = await evaluate(`({
    count: document.querySelectorAll('[data-vehicle-card]').length,
    heading: document.querySelector('[data-vehicle-card] h3')?.textContent.trim(),
    priceTry: Number(document.querySelector('[data-vehicle-card]')
      ?.getAttribute('data-monthly-list-net-price-try')),
    filterCount: Number(document.querySelector('[data-vehicle-filter-count]')
      ?.getAttribute('data-vehicle-filter-count')),
  })`);

  await navigate(`${origin}/arac-listesi/?marka=Unknown&model=Imaginary`);
  const unknownQueryState = await evaluate(`({
    count: document.querySelectorAll('[data-vehicle-card]').length,
    filterCount: Number(document.querySelector('[data-vehicle-filter-count]')
      ?.getAttribute('data-vehicle-filter-count')),
  })`);

  if (
    renaultState.count !== 4 ||
    renaultState.query !== "?marka=Renault" ||
    renaultState.modelDisabled !== false ||
    renaultState.modelOptions.join("|") !==
      "|Austral|Clio|Duster|Megane Sedan" ||
    renaultState.headings.join("|") !==
      "Renault Clio|Renault Megane Sedan|Renault Duster|Renault Austral" ||
    clioState.count !== 1 ||
    clioState.query !== "?marka=Renault&model=Clio" ||
    clioState.heading !== "Renault Clio" ||
    clioState.priceTry !== 40_200 ||
    !clickedSuv ||
    suvState.count !== 13 ||
    suvState.query !== "?kategori=SUV" ||
    suvState.pressed !== "true" ||
    electricState.count !== 2 ||
    electricState.query !== "?yakit=Elektrik" ||
    electricState.headings.join("|") !== "Kia EV3|Tesla Model Y" ||
    exactQueryState.count !== 1 ||
    exactQueryState.heading !== "Ford Transit Van" ||
    exactQueryState.priceTry !== 64_400 ||
    exactQueryState.filterCount !== 2 ||
    unknownQueryState.count !== 32 ||
    unknownQueryState.filterCount !== 0
  ) {
    throw new Error(
      `Vehicle filter smoke assertion failed: ${JSON.stringify({
        clioState,
        clickedSuv,
        electricState,
        exactQueryState,
        renaultState,
        suvState,
        unknownQueryState,
      })}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        deployOrigin,
        sitemapUrlCount: 0,
        responsiveReports,
        filterStates: {
          clioState,
          electricState,
          exactQueryState,
          renaultState,
          suvState,
          unknownQueryState,
        },
        screenshotDirectory: screenshotMode ? temporaryRoot : undefined,
      },
      null,
      2,
    ),
  );
  socket.close();
} finally {
  server.close();
  if (!edge.killed) {
    spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
  }
  if (!screenshotMode) {
    await delay(1000);
    try {
      rmSync(temporaryRoot, {
        force: true,
        maxRetries: 10,
        recursive: true,
        retryDelay: 250,
      });
    } catch (error) {
      console.warn(
        `Temporary browser profile could not be removed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
