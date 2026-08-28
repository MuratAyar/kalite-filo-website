import { spawn, spawnSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdtempSync,
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
const expectedFeaturedVehicleCards = [
  { priceTry: 40_200, sourceId: "KF-001" },
  { priceTry: 39_000, sourceId: "KF-002" },
  { priceTry: 43_200, sourceId: "KF-003" },
  { priceTry: 40_200, sourceId: "KF-004" },
];
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "kalite-filo-home-qa-"));
const profileRoot = path.join(temporaryRoot, "edge-profile");

const edgeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const edgePath = edgeCandidates.find(existsSync);

if (!edgePath) {
  throw new Error("Microsoft Edge was not found for the Home smoke test.");
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
  const pathname = decodeURIComponent(new URL(requestUrl, "http://local").pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const candidate = path.resolve(outputRoot, relativePath);

  if (!candidate.startsWith(`${outputRoot}${path.sep}`) && candidate !== outputRoot) {
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
    "Content-Type": contentTypes.get(path.extname(outputPath)) ?? "application/octet-stream",
  });
  createReadStream(outputPath).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const serverAddress = server.address();

if (!serverAddress || typeof serverAddress === "string") {
  throw new Error("The local static server did not expose a TCP port.");
}

const origin = `http://127.0.0.1:${serverAddress.port}`;
const debuggerPort = 9223;
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

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
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
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
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
        if (message.error) callback.reject(new Error(message.error.message));
        else callback.resolve(message.result);
      }
      return;
    }

    const waiters = eventWaiters.get(message.method);
    if (waiters?.length) waiters.shift()(message.params);
  });

  function send(method, params = {}) {
    const id = nextId;
    nextId += 1;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { reject, resolve });
    });
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
    await loaded;
    await delay(400);
  }

  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
    });
    return result.result.value;
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("CSS.enable");

  const reports = [];
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: width <= 390 ? 900 : 1100,
      mobile: width < 768,
      width,
    });
    await navigate(`${origin}/`);

    if (width < 1024) {
      await evaluate("document.querySelector('header details').open = true");
    }

    const report = await evaluate(`(() => {
      const root = document.documentElement;
      const logo = document.querySelector('header img[alt="Kalite Filo"]');
      const heroImage = document.querySelector('img[src="/images/home/hero-fleet-highway.jpg"]');
      const finder = document.querySelector('form[action="/arac-listesi/"]');
      const makeSelect = finder?.querySelector('select[name="marka"]');
      const modelSelect = finder?.querySelector('select[name="model"]');
      const quote = document.querySelector('header a[href="/teklif-al/"]');
      const desktopNavigation = document.querySelector('header nav[aria-label="Ana menü"]');
      const vehicleCardHeadings = [...document.querySelectorAll(
        'section[aria-labelledby="featured-vehicles-title"] h3'
      )].map((heading) => heading.textContent.trim());
      const featuredVehicleCards = [...document.querySelectorAll(
        'section[aria-labelledby="featured-vehicles-title"] [data-vehicle-source-id]'
      )].map((card) => {
        const price = card.querySelector('[data-vehicle-list-price="true"]');
        const priceData = price?.querySelector('data');
        const priceText = price?.innerText ?? '';
        const facts = [...card.querySelectorAll('[data-vehicle-fact]')];
        const transmissionDisplay = card.querySelector(
          '[data-vehicle-fact="transmission"]'
        )?.getAttribute('data-vehicle-transmission-display');
        const factTops = facts.map((fact) => fact.getBoundingClientRect().top);
        const media = card.querySelector('[data-vehicle-media="true"]');
        const cardLink = card.querySelector('a[data-vehicle-card-link="true"]');
        const cardCta = card.querySelector('[data-vehicle-card-cta="true"]');
        return {
          sourceId: card.getAttribute('data-vehicle-source-id'),
          priceTry: Number(card.getAttribute('data-monthly-list-net-price-try')),
          priceDataValue: Number(priceData?.value),
          factCount: facts.length,
          transmissionDisplay,
          factsLayout: card.querySelector('[data-vehicle-facts="true"]')
            ?.getAttribute('data-vehicle-facts-layout'),
          factsStartOnSingleRow: factTops.length === 2 &&
            Math.max(...factTops) - Math.min(...factTops) <= 1,
          mediaCount: card.querySelectorAll('[data-vehicle-media="true"]').length,
          hasCategoryBadgeText: ['Binek', 'SUV', 'Ticari Araçlar']
            .some((label) => media?.innerText.includes(label)),
          perCardCreditLinkCount: card.querySelectorAll('[data-asset-credit="true"]').length,
          hasPerCardCreditText: card.innerText.includes('Görsel:'),
          hasMonthlyListNetLabel: priceText.includes('Aylık Liste Net'),
          hasVatExcludedLabel: priceText.includes('+ %20 KDV'),
          hasMonthlySuffix: priceText.includes('/ay'),
          cardLinkCount: card.querySelectorAll(
            'a[data-vehicle-card-link="true"][href="/teklif-al/"]'
          ).length,
          nestedLinkCount: cardLink?.querySelectorAll('a').length ?? -1,
          ctaCount: card.querySelectorAll('[data-vehicle-card-cta="true"]').length,
          ctaUsesCardHover: cardCta?.classList.contains('group-hover:bg-orange-dark') ?? false,
        };
      });
      const editorialCardHeadings = [...document.querySelectorAll(
        'section[aria-labelledby="editorial-preview-title"] h3'
      )].map((heading) => heading.textContent.trim());
      const editorialLinks = [...document.querySelectorAll(
        'a[data-editorial-preview-article-link="true"]'
      )];
      editorialLinks[0]?.focus();
      const editorialFocusedBorderColor = editorialLinks[0]
        ? getComputedStyle(editorialLinks[0].closest('li')).borderColor
        : null;
      const footer = document.querySelector('footer');
      const whyLayout = document.querySelector(
        'section[aria-labelledby="why-kalite-filo-title"] [data-why-layout]'
      );
      const whySection = whyLayout?.closest('section');
      const solutionCards = [...document.querySelectorAll(
        'a[data-fleet-solution-card="true"]'
      )].map((link) => ({
        articleCount: link.querySelectorAll(':scope > article').length,
        href: new URL(link.href).pathname,
        nestedLinkCount: link.querySelectorAll('a').length,
        textDecorationLine: getComputedStyle(link).textDecorationLine,
      }));
      return {
        viewport: ${width},
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        noHorizontalOverflow: root.scrollWidth === root.clientWidth,
        h1Count: document.querySelectorAll('h1').length,
        homeSectionCount: document.querySelectorAll('main > section').length,
        logo: logo ? {
          naturalWidth: logo.naturalWidth,
          naturalHeight: logo.naturalHeight,
          renderedWidth: Math.round(logo.getBoundingClientRect().width),
        } : null,
        heroImage: heroImage ? {
          complete: heroImage.complete,
          naturalWidth: heroImage.naturalWidth,
          naturalHeight: heroImage.naturalHeight,
        } : null,
        finder: finder ? {
          action: new URL(finder.action).pathname,
          method: finder.method,
          names: [...finder.elements].map((element) => element.name).filter(Boolean),
          makeDisabled: makeSelect?.disabled ?? null,
          modelDisabled: modelSelect?.disabled ?? null,
          makeOptionCount: makeSelect?.options.length ?? 0,
        } : null,
        vehicleCardHeadings,
        featuredVehicleCards,
        whyLayout: whyLayout?.getAttribute('data-why-layout') ?? null,
        whyBorderWidth: whyLayout ? getComputedStyle(whyLayout).borderWidth : null,
        whyPaddingTop: whySection
          ? Number.parseFloat(getComputedStyle(whySection).paddingTop)
          : null,
        solutionCards,
        overflowingElements: [...document.querySelectorAll('body *')]
          .filter((element) => element.getBoundingClientRect().right > root.clientWidth + 1)
          .slice(0, 12)
          .map((element) => ({
            className: String(element.className),
            right: Math.round(element.getBoundingClientRect().right),
            tag: element.tagName,
            text: element.textContent.trim().slice(0, 60),
          })),
        vehicleImageCreditComponentCount: document.querySelectorAll(
          '[data-vehicle-image-credits="true"]'
        ).length,
        editorialCardHeadings,
        editorialArticleHrefs: editorialLinks.map((link) =>
          new URL(link.href).pathname
        ),
        editorialFocusedBorderColor,
        footer: footer ? {
          hasPhone: Boolean(footer.querySelector('a[href="tel:+905317158068"]')),
          hasEmail: Boolean(footer.querySelector('a[href="mailto:info@kalitefilo.com.tr"]')),
          hasPrivacySecurity: Boolean(footer.querySelector('a[href="/kvkk-ve-guvenlik/"]')),
          hasCookiePolicy: Boolean(footer.querySelector('a[href="/cerez-politikasi/"]')),
          hasTerms: Boolean(footer.querySelector('a[href="/kullanim-kosullari/"]')),
          hasShortFaqLabel: [...footer.querySelectorAll('a')]
            .some((link) => link.textContent.trim() === 'SSS'),
          hasVehicleLicenseLedger: Boolean(
            document.querySelector('a[href="/images/vehicles/LICENSES.md"]')
          ),
        } : null,
        mobileMenuOpen: document.querySelector('header details')?.open ?? null,
        quoteHeight: quote ? Math.round(quote.getBoundingClientRect().height) : null,
        desktopNavigationLabels: desktopNavigation && desktopNavigation.offsetParent !== null
          ? [...desktopNavigation.querySelectorAll('a')].map((link) => link.textContent.trim())
          : [],
        desktopNavigationCenterDelta: desktopNavigation && desktopNavigation.offsetParent !== null
          ? Math.round(Math.abs(
              desktopNavigation.getBoundingClientRect().left +
              desktopNavigation.getBoundingClientRect().width / 2 -
              root.clientWidth / 2
            ))
          : null,
        newsletterDemo: Boolean(
          document.querySelector('#newsletter-preview-email:not(:disabled)') &&
          document.querySelector('#newsletter-preview-email')
            ?.closest('section')
            ?.querySelector('dialog')
        ),
        remoteResources: performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((url) => !url.startsWith(location.origin) && !url.startsWith('data:')),
      };
    })()`);
    reports.push(report);

    if (screenshotMode && (width === 320 || width === 1440)) {
      const screenshot = await send("Page.captureScreenshot", {
        captureBeyondViewport: width === 1440,
        format: "png",
      });
      writeFileSync(
        path.join(temporaryRoot, `home-${width}.png`),
        Buffer.from(screenshot.data, "base64"),
      );
    }
  }

  await send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height: 900,
    mobile: false,
    width: 1024,
  });
  await navigate(`${origin}/`);
  await evaluate(`document.querySelector('form[action="/arac-listesi/"]')?.requestSubmit()`);
  await delay(1200);
  const emptyFilterState = await evaluate(`({
    pathname: location.pathname,
    search: location.search,
    resultCount: document.querySelectorAll('[data-vehicle-card]').length,
  })`);

  await navigate(`${origin}/`);
  await evaluate(`(() => {
    const form = document.querySelector('form[action="/arac-listesi/"]');
    const make = form?.querySelector('select[name="marka"]');
    if (!form || !make) return false;
    make.value = 'Renault';
    make.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await delay(150);
  await evaluate(`document.querySelector('form[action="/arac-listesi/"]')?.requestSubmit()`);
  await delay(1200);
  const makeOnlyFilterState = await evaluate(`({
    pathname: location.pathname,
    search: location.search,
    makeValue: document.querySelector('#desktop-vehicle-filter-make')?.value,
    modelValue: document.querySelector('#desktop-vehicle-filter-model')?.value,
    resultCount: document.querySelectorAll('[data-vehicle-card]').length,
  })`);

  await navigate(`${origin}/`);
  await evaluate(`(() => {
    const make = document.querySelector('#quick-vehicle-make');
    const model = document.querySelector('#quick-vehicle-model');
    if (!make || !model) return false;
    make.value = 'Renault';
    make.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await delay(100);
  const finderInteractionState = await evaluate(`(() => {
    const make = document.querySelector('#quick-vehicle-make');
    const model = document.querySelector('#quick-vehicle-model');
    if (!make || !model) return null;
    return {
      makeValue: make.value,
      modelDisabled: model.disabled,
      modelOptions: [...model.options].map((option) => option.textContent.trim()),
    };
  })()`);
  await evaluate(`(() => {
    const action = document.querySelector('a[data-featured-vehicles-action="true"]');
    if (!action) return false;
    action.scrollIntoView({ block: 'center', behavior: 'instant' });
    return true;
  })()`);
  await delay(150);
  const featuredBrowseActionRect = await evaluate(`(() => {
    const action = document.querySelector('a[data-featured-vehicles-action="true"]');
    if (!action) return null;
    const rect = action.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  })()`);
  let featuredMatchedHoverRules = [];
  if (featuredBrowseActionRect) {
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: featuredBrowseActionRect.x,
      y: featuredBrowseActionRect.y,
    });
    const { root } = await send("DOM.getDocument", { depth: 0 });
    const { nodeId } = await send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: 'a[data-featured-vehicles-action="true"]',
    });
    await send("CSS.forcePseudoState", {
      forcedPseudoClasses: ["hover"],
      nodeId,
    });
    const matchedStyles = await send("CSS.getMatchedStylesForNode", { nodeId });
    featuredMatchedHoverRules = (matchedStyles.matchedCSSRules ?? [])
      .map((entry) => entry.rule?.selectorList?.text)
      .filter((selector) => selector?.includes("hover"));
    await delay(1000);
  }
  const featuredBrowseActionState = await evaluate(`(() => {
    const action = document.querySelector('a[data-featured-vehicles-action="true"]');
    if (!action) return null;
    const style = getComputedStyle(action);
    const rect = action.getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      color: style.color,
      height: Math.round(action.getBoundingClientRect().height),
      href: new URL(action.href).pathname,
      hovered: action.matches(':hover'),
      hitElement: hit?.tagName ?? null,
      hitText: hit?.textContent?.trim() ?? null,
      corporateBlue: getComputedStyle(document.documentElement)
        .getPropertyValue('--kf-corporate-blue').trim(),
      hoverRulePresent: [...document.styleSheets].some((sheet) => {
        try {
          return [...sheet.cssRules].some((rule) =>
            rule.cssText.includes('.featured-vehicles-action:hover')
          );
        } catch {
          return false;
        }
      }),
      transitionDuration: style.transitionDuration,
      transitionProperty: style.transitionProperty,
    };
  })()`);
  await evaluate("document.querySelector('#newsletter-preview-email')?.focus()");
  await delay(100);
  const newsletterFocusState = await evaluate(`(() => {
    const input = document.querySelector('#newsletter-preview-email');
    const focusWrapper = input?.parentElement;
    if (!input || !focusWrapper) return null;
    const inputStyle = getComputedStyle(input);
    const wrapperStyle = getComputedStyle(focusWrapper);
    return {
      inputOutlineStyle: inputStyle.outlineStyle,
      wrapperBorderColor: wrapperStyle.borderColor,
      wrapperBoxShadow: wrapperStyle.boxShadow,
    };
  })()`);
  const newsletterDemoState = await evaluate(`(async () => {
    const input = document.querySelector('#newsletter-preview-email');
    const form = input?.form;
    const dialog = document.querySelector('[aria-labelledby="newsletter-demo-title"]');
    if (!input || !form || !dialog) return null;
    const originalFetch = window.fetch;
    window.fetch = async () => new Response(JSON.stringify({ result: 'basarili' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    input.value = 'tasarim@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.querySelector('input[name="consent"]').checked = true;
    form.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.fetch = originalFetch;
    return {
      dialogOpen: dialog.open,
      inputCleared: input.value === '',
      message: dialog.innerText,
    };
  })()`);

  if (
    !newsletterDemoState?.dialogOpen ||
    !newsletterDemoState.inputCleared ||
    newsletterFocusState?.inputOutlineStyle !== "none" ||
    !newsletterFocusState?.wrapperBorderColor?.includes("255, 179, 67") ||
    newsletterFocusState?.wrapperBoxShadow !== "none" ||
    featuredBrowseActionState?.href !== "/arac-listesi/" ||
    featuredBrowseActionState?.height !== 54 ||
    featuredBrowseActionState?.backgroundColor?.replace(/\s/g, "") !==
      "rgba(0,0,0,0)" ||
    featuredBrowseActionState?.borderColor?.replace(/\s/g, "") !==
      "rgb(24,33,54)" ||
    featuredBrowseActionState?.color?.replace(/\s/g, "") !==
      "rgb(24,33,54)" ||
    !newsletterDemoState.message.includes("Kayıt talebiniz alındı") ||
    !newsletterDemoState.message.includes("onay bekleyen")
  ) {
    throw new Error(
      `Newsletter/featured action smoke assertion failed: ${JSON.stringify({
        featuredBrowseActionState,
        featuredMatchedHoverRules,
        newsletterDemoState,
        newsletterFocusState,
      })}`,
    );
  }

  await send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height: 900,
    mobile: false,
    width: 1024,
  });
  await navigate(`${origin}/`);
  await evaluate(`(() => {
    const make = document.querySelector('form[action="/arac-listesi/"] select[name="marka"]');
    if (!make) return false;
    make.value = 'Renault';
    make.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await delay(150);
  await evaluate(`(() => {
    const form = document.querySelector('form[action="/arac-listesi/"]');
    const model = form?.querySelector('select[name="model"]');
    if (!form || !model || model.disabled) return false;
    model.value = 'Clio';
    model.dispatchEvent(new Event('change', { bubbles: true }));
    form.requestSubmit();
    return true;
  })()`);
  await delay(1500);
  const filterState = await evaluate(`({
    text: document.querySelector('#selected-vehicle-filters-title')?.parentElement?.innerText,
    pathname: location.pathname,
    search: location.search,
    makeValue: document.querySelector('#desktop-vehicle-filter-make')?.value,
    modelValue: document.querySelector('#desktop-vehicle-filter-model')?.value,
    resultCount: document.querySelectorAll('[data-vehicle-card]').length,
    robots: document.querySelector('meta[name="robots"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  })`);
  await navigate(`${origin}/`);
  await evaluate(`document.querySelector('a[data-fleet-solution-card="true"]')?.click()`);
  await delay(900);
  const fleetSolutionNavigationState = await evaluate(`({
    pathname: location.pathname,
    search: location.search,
  })`);
  const activeNavigationStates = [];
  for (const [pathname, expectedHref] of [
    ["/hakkimizda/", "/hakkimizda/"],
    ["/arac-listesi/", "/arac-listesi/"],
    ["/sikca-sorulan-sorular/", "/sikca-sorulan-sorular/"],
    ["/filo-rehberi/", "/filo-rehberi/"],
  ]) {
    await navigate(`${origin}${pathname}`);
    activeNavigationStates.push(
      await evaluate(`(() => {
        const desktop = document.querySelector(
          'header nav[aria-label="Ana menü"] a[aria-current="page"]'
        );
        const mobile = document.querySelector(
          'header nav[aria-label="Mobil ana menü"] a[aria-current="page"]'
        );
        return {
          pathname: location.pathname,
          expectedHref: ${JSON.stringify(expectedHref)},
          desktopHref: desktop ? new URL(desktop.href).pathname : null,
          mobileHref: mobile ? new URL(mobile.href).pathname : null,
          desktopColor: desktop ? getComputedStyle(desktop).color : null,
          mobileColor: mobile ? getComputedStyle(mobile).color : null,
          desktopCurrentCount: document.querySelectorAll(
            'header nav[aria-label="Ana menü"] a[aria-current="page"]'
          ).length,
          mobileCurrentCount: document.querySelectorAll(
            'header nav[aria-label="Mobil ana menü"] a[aria-current="page"]'
          ).length,
        };
      })()`),
    );
  }
  const heroImageHttpStatus = await (
    await fetch(`${origin}/images/home/hero-fleet-highway.jpg`)
  ).status;

  for (const report of reports) {
    if (
      !report.noHorizontalOverflow ||
      report.h1Count !== 1 ||
      report.homeSectionCount !== 8 ||
      report.heroImage?.naturalWidth !== 1600 ||
      report.heroImage?.naturalHeight !== 900 ||
      report.finder?.method !== "get" ||
      report.finder?.action !== "/arac-listesi/" ||
      report.finder?.names.join(",") !== "marka,model" ||
      report.finder?.modelDisabled !== true ||
      report.finder?.makeOptionCount !== 15 ||
      report.vehicleCardHeadings.join("|") !==
        "Renault Clio|Hyundai i20|Opel Corsa|Fiat Egea Sedan" ||
      report.featuredVehicleCards.length !== 4 ||
      report.featuredVehicleCards.some((card, index) => {
        const expected = expectedFeaturedVehicleCards[index];
        return (
          card.sourceId !== expected?.sourceId ||
          card.priceTry !== expected.priceTry ||
          card.priceDataValue !== expected.priceTry ||
          card.factCount !== 2 ||
          !["Manuel", "Otomatik", "Yarı Otomatik"].includes(
            card.transmissionDisplay,
          ) ||
          card.factsLayout !== "single-row" ||
          !card.factsStartOnSingleRow ||
          card.mediaCount !== 1 ||
          card.hasCategoryBadgeText ||
          card.perCardCreditLinkCount !== 0 ||
          card.hasPerCardCreditText ||
          card.hasMonthlyListNetLabel ||
          !card.hasVatExcludedLabel ||
          !card.hasMonthlySuffix ||
          card.cardLinkCount !== 1 ||
          card.nestedLinkCount !== 0 ||
          card.ctaCount !== 1 ||
          !card.ctaUsesCardHover
        );
      }) ||
      report.whyLayout !== "unframed" ||
      report.whyBorderWidth !== "0px" ||
      report.whyPaddingTop < 64 ||
      report.solutionCards.length !== 4 ||
      report.solutionCards.some(
        (card) =>
          card.articleCount !== 1 ||
          card.nestedLinkCount !== 0 ||
          !["/arac-listesi/", "/teklif-al/"].includes(card.href) ||
          card.textDecorationLine !== "none",
      ) ||
      report.vehicleImageCreditComponentCount !== 0 ||
      report.editorialCardHeadings.length !== 4 ||
      report.editorialArticleHrefs.length !== 4 ||
      report.editorialArticleHrefs.some(
        (href) => !/^\/filo-rehberi\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(href),
      ) ||
      report.editorialFocusedBorderColor?.replace(/\s/g, "") !==
        "rgb(255,179,67)" ||
      !report.footer?.hasPhone ||
      !report.footer?.hasEmail ||
      !report.footer?.hasPrivacySecurity ||
      !report.footer?.hasCookiePolicy ||
      !report.footer?.hasTerms ||
      !report.footer?.hasShortFaqLabel ||
      report.footer?.hasVehicleLicenseLedger ||
      (report.viewport >= 1024
        ? report.desktopNavigationLabels.join("|") !==
            "Hakkımızda|Araç Listesi|Sıkça Sorulan Sorular|Filo Rehberi" ||
          report.desktopNavigationCenterDelta > 1
        : report.desktopNavigationLabels.length > 0) ||
      report.remoteResources.length > 0 ||
      !report.newsletterDemo
    ) {
      throw new Error(
        `Home smoke assertion failed at ${report.viewport}px: ${JSON.stringify(report)}`,
      );
    }
  }

  if (
    emptyFilterState.pathname !== "/arac-listesi/" ||
    emptyFilterState.search !== "" ||
    emptyFilterState.resultCount !== 32 ||
    makeOnlyFilterState.pathname !== "/arac-listesi/" ||
    makeOnlyFilterState.search !== "?marka=Renault" ||
    makeOnlyFilterState.makeValue !== "Renault" ||
    makeOnlyFilterState.modelValue !== "" ||
    makeOnlyFilterState.resultCount !== 4 ||
    fleetSolutionNavigationState.pathname !== "/arac-listesi/" ||
    fleetSolutionNavigationState.search !== "" ||
    activeNavigationStates.some(
      (state) =>
        state.pathname !== state.expectedHref ||
        state.desktopHref !== state.expectedHref ||
        state.mobileHref !== state.expectedHref ||
        state.desktopCurrentCount !== 1 ||
        state.mobileCurrentCount !== 1 ||
        state.desktopColor?.replace(/\s/g, "") !== "rgb(1,68,153)" ||
        state.mobileColor?.replace(/\s/g, "") !== "rgb(1,68,153)",
    ) ||
    finderInteractionState?.makeValue !== "Renault" ||
    finderInteractionState?.modelDisabled !== false ||
    !finderInteractionState?.modelOptions.includes("Clio") ||
    filterState.pathname !== "/arac-listesi/" ||
    filterState.search !== "?marka=Renault&model=Clio" ||
    filterState.makeValue !== "Renault" ||
    filterState.modelValue !== "Clio" ||
    filterState.resultCount !== 1 ||
    !filterState.text?.includes("Renault") ||
    !filterState.text?.includes("Clio") ||
    !filterState.robots?.startsWith("noindex, nofollow") ||
    filterState.scrollWidth !== filterState.clientWidth ||
    heroImageHttpStatus !== 200
  ) {
    throw new Error(
      `Vehicle query or local-image smoke assertion failed: ${JSON.stringify({
        filterState,
        featuredBrowseActionState,
        emptyFilterState,
        makeOnlyFilterState,
        fleetSolutionNavigationState,
        activeNavigationStates,
        finderInteractionState,
        heroImageHttpStatus,
      })}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        filterState,
        featuredBrowseActionState,
        emptyFilterState,
        finderInteractionState,
        makeOnlyFilterState,
        fleetSolutionNavigationState,
        activeNavigationStates,
        heroImageHttpStatus,
        newsletterFocusState,
        newsletterDemoState,
        reports,
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
