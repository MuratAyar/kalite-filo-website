"use client";

import { FormEvent, useEffect, useState } from "react";
import { VehicleManager } from "./vehicle-manager";
import { TagManager } from "./tag-manager";
import { FeaturedVehiclesManager } from "./featured-vehicles-manager";
import { FeaturedArticlesManager } from "./featured-articles-manager";
import { AuditLogView } from "./audit-log-view";
import { ArticleListView } from "./article-list-view";
import { MediaLibraryView } from "./media-library-view";
import { SubscriberListView } from "./subscriber-list-view";
import { IysManagementView } from "./iys-management-view";
import { CampaignManager } from "./campaign-manager";
import { PublishingCenter } from "./publishing-center";
import { FormSubmissionsView } from "./form-submissions-view";

type AdminIdentity = {
  id: string;
  username: string;
  displayName: string;
  role: string;
};

type SessionState = {
  authenticated: boolean;
  csrfToken: string;
  environment: "production" | "staging";
  user?: AdminIdentity;
};

type DashboardActivity = {
  id: string;
  timestamp: string;
  adminId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  result: string;
};

type DashboardData = {
  metrics: {
    activeVehicles: number;
    featuredVehicles: number;
    articles: number;
    draftArticles: number;
    newsletterContacts: number;
    approvedMarketingConsents: number;
    iysPending: number;
    unsubscribed: number;
  };
  recentActivity: DashboardActivity[];
  publishing: { staging: null; production: null };
  failures: unknown[];
  snapshotGeneratedAt: string;
};

const endpoints = {
  session: "/admin-api/session.php",
  login: "/admin-api/login.php",
  logout: "/admin-api/logout.php",
  dashboard: "/admin-api/dashboard.php",
} as const;

async function readResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  const payload: unknown = await response.json().catch(() => ({}));
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : {};
}

function parseSession(payload: Record<string, unknown>): SessionState | null {
  if (
    typeof payload.authenticated !== "boolean" ||
    typeof payload.csrfToken !== "string" ||
    (payload.environment !== "production" && payload.environment !== "staging")
  ) {
    return null;
  }
  const rawUser = payload.user;
  const user =
    typeof rawUser === "object" &&
    rawUser !== null &&
    typeof (rawUser as Record<string, unknown>).id === "string" &&
    typeof (rawUser as Record<string, unknown>).username === "string" &&
    typeof (rawUser as Record<string, unknown>).displayName === "string" &&
    typeof (rawUser as Record<string, unknown>).role === "string"
      ? (rawUser as AdminIdentity)
      : undefined;
  if (payload.authenticated && !user) return null;
  return {
    authenticated: payload.authenticated,
    csrfToken: payload.csrfToken,
    environment: payload.environment,
    user,
  };
}

function parseDashboard(
  payload: Record<string, unknown>,
): DashboardData | null {
  const metrics = payload.metrics;
  const activity = payload.recentActivity;
  const publishing = payload.publishing;
  const metricKeys = [
    "activeVehicles",
    "featuredVehicles",
    "articles",
    "draftArticles",
    "newsletterContacts",
    "approvedMarketingConsents",
    "iysPending",
    "unsubscribed",
  ] as const;
  if (
    typeof metrics !== "object" ||
    metrics === null ||
    !metricKeys.every((key) =>
      Number.isSafeInteger((metrics as Record<string, unknown>)[key]),
    ) ||
    !Array.isArray(activity) ||
    !Array.isArray(payload.failures) ||
    typeof publishing !== "object" ||
    publishing === null ||
    typeof payload.snapshotGeneratedAt !== "string"
  )
    return null;
  const parsedActivity = activity.filter((item): item is DashboardActivity => {
    if (typeof item !== "object" || item === null) return false;
    const record = item as Record<string, unknown>;
    return (
      typeof record.id === "string" &&
      typeof record.timestamp === "string" &&
      (typeof record.adminId === "string" || record.adminId === null) &&
      typeof record.action === "string" &&
      typeof record.entityType === "string" &&
      (typeof record.entityId === "string" || record.entityId === null) &&
      typeof record.result === "string"
    );
  });
  return {
    metrics: metrics as DashboardData["metrics"],
    recentActivity: parsedActivity,
    publishing: { staging: null, production: null },
    failures: payload.failures,
    snapshotGeneratedAt: payload.snapshotGeneratedAt,
  };
}

const activityLabels: Record<string, string> = {
  login: "Oturum açıldı",
  logout: "Oturum kapatıldı",
  failed_login: "Başarısız giriş denemesi",
  iys_export: "İYS CSV export oluşturuldu",
  subscriber_unsubscribe: "Abonelik sonlandırıldı",
  subscriber_iys_update: "Abone İYS bilgileri güncellendi",
  subscriber_record_correction: "Bülten kişi kaydı düzeltildi",
};

function formatActivityDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Tarih bilinmiyor"
    : new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function messageForError(
  error: unknown,
  diagnostic?: unknown,
  reference?: unknown,
): string {
  if (error === "invalid_credentials") {
    return "Kullanıcı adı veya parola doğrulanamadı.";
  }
  if (error === "login_rate_limited") {
    return "Çok fazla başarısız deneme yapıldı. Lütfen daha sonra tekrar deneyin.";
  }
  if (error === "csrf_failed") {
    return "Güvenlik oturumu yenilenemedi. Sayfayı yeniden yükleyin.";
  }
  if (error === "forbidden") {
    return "Giriş isteğinin kaynağı doğrulanamadı. Staging adresini yeniden açıp tekrar deneyin.";
  }
  if (error === "invalid_request" || error === "unsupported_media_type") {
    return "Giriş isteği sunucu tarafından geçerli formatta alınamadı. Sayfayı yenileyip tekrar deneyin.";
  }
  const referenceSuffix =
    typeof reference === "string" ? ` Hata referansı: ${reference}.` : "";
  if (diagnostic === "login_protection_storage") {
    return `Giriş koruma dizinine yazılamıyor. Private data/rate-limits izinlerini kontrol edin.${referenceSuffix}`;
  }
  if (diagnostic === "session_storage") {
    return `Admin session dizinine yazılamıyor. Private data/sessions izinlerini kontrol edin.${referenceSuffix}`;
  }
  if (diagnostic === "private_configuration") {
    return `Private admin config okunamadı veya geçersiz. config.php içeriğini kontrol edin.${referenceSuffix}`;
  }
  if (diagnostic === "private_storage") {
    return `Private admin data dizini oluşturulamıyor veya yazılamıyor.${referenceSuffix}`;
  }
  if (error === "service_unavailable") {
    return `Yönetim servisi giriş işlemini tamamlayamadı.${referenceSuffix}`;
  }
  return "Yönetim servisine şu anda ulaşılamıyor.";
}

export function AdminApp() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [view, setView] = useState<
    | "dashboard"
    | "vehicles"
    | "draftVehicles"
    | "featuredVehicles"
    | "tags"
    | "audit"
    | "articles"
    | "draftArticles"
    | "featuredArticles"
    | "media"
    | "subscribers"
    | "iys"
    | "campaigns"
    | "quoteForms"
    | "contactForms"
    | "publishing"
  >("dashboard");
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [articlesOpen, setArticlesOpen] = useState(false);
  const [formsOpen, setFormsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(endpoints.session, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const parsed = parseSession(await readResponse(response));
        if (!response.ok || !parsed) throw new Error("session_unavailable");
        if (active) setSession(parsed);
      })
      .catch(() => {
        if (active) setError("Yönetim servisine şu anda ulaşılamıyor.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.authenticated || view !== "dashboard") return;
    let active = true;
    void fetch(endpoints.dashboard, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const parsed = parseDashboard(await readResponse(response));
        if (!response.ok || !parsed) throw new Error("dashboard_unavailable");
        if (active) {
          setDashboardError("");
          setDashboard(parsed);
        }
      })
      .catch(() => {
        if (active)
          setDashboardError("Dashboard verileri şu anda yüklenemiyor.");
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.authenticated, view]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!session) {
      setError(
        "Giriş servisi bu yerel Next.js önizlemesinde çalışmıyor. Kimlik doğrulamak için PHP içeren staging release’i kullanın.",
      );
      return;
    }
    setSubmitting(true);
    setError("");
    const form = new FormData(formElement);
    try {
      const response = await fetch(endpoints.login, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": session.csrfToken,
        },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const payload = await readResponse(response);
      const parsed = parseSession(payload);
      if (!response.ok || !parsed) {
        setError(
          messageForError(payload.error, payload.diagnostic, payload.reference),
        );
        return;
      }
      formElement.reset();
      setDashboardLoading(true);
      setSession(parsed);
    } catch {
      setError("Yönetim servisine şu anda ulaşılamıyor.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    if (!session) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(endpoints.logout, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": session.csrfToken,
        },
        body: "{}",
      });
      if (!response.ok) {
        const payload = await readResponse(response);
        setError(
          messageForError(payload.error, payload.diagnostic, payload.reference),
        );
        return;
      }
      const bootstrapResponse = await fetch(endpoints.session, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const parsed = parseSession(await readResponse(bootstrapResponse));
      if (!bootstrapResponse.ok || !parsed)
        throw new Error("session_unavailable");
      setSession(parsed);
      setDashboard(null);
    } catch {
      setError("Oturum kapatılamadı. Lütfen sayfayı yenileyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="relative grid min-h-svh place-items-center overflow-hidden bg-brand-navy px-gutter">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-35"
          height="720"
          src="/images/home/fleet-campus.jpg"
          width="1280"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-brand-navy/75" />
        <p
          aria-live="polite"
          className="relative rounded-pill border border-white/15 bg-brand-navy/80 px-5 py-3 text-label text-text-inverse-muted"
        >
          Güvenli oturum kontrol ediliyor…
        </p>
      </main>
    );
  }

  if (!session?.authenticated || !session.user) {
    const serviceAvailable = session !== null;
    return (
      <main className="relative grid min-h-svh place-items-center overflow-hidden bg-brand-navy px-gutter py-8 sm:py-12">
        {/* Static export uses the existing approved local fleet image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-[1.03] object-cover"
          height="720"
          src="/images/home/fleet-campus.jpg"
          width="1280"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(120deg,rgb(5_13_31_/_0.9),rgb(24_33_54_/_0.7)_52%,rgb(5_13_31_/_0.86))]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-brand-navy to-transparent"
        />

        <section
          aria-label="Admin girişi"
          className="relative w-full max-w-[31rem] overflow-hidden rounded-panel border border-white/15 bg-brand-navy/95 shadow-[0_2rem_5rem_rgb(0_0_0_/_0.38)] backdrop-blur-md"
        >
          <div className="p-6 sm:p-9">
            <h1 className="sr-only">Admin girişi</h1>
            <div className="mb-8">
              <div className="w-fit rounded-control bg-white px-3 py-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Kalite Filo"
                  className="h-auto w-36"
                  height="112"
                  src="/images/brand/kalite-filo-logo.png"
                  width="560"
                />
              </div>
            </div>

            <div className="mb-7">
              <p className="text-label font-semibold tracking-[0.08em] text-accent-orange uppercase">
                Yetkili erişimi
              </p>
            </div>

            {!serviceAvailable ? (
              <div className="mb-5 rounded-control border border-accent-orange/35 bg-accent-orange/10 px-4 py-3 text-sm text-orange-light">
                Arayüz hazır. Giriş doğrulaması PHP içeren staging/release
                ortamında etkinleşir.
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label
                  className="text-label font-semibold text-text-inverse"
                  htmlFor="admin-username"
                >
                  Kullanıcı adı
                </label>
                <input
                  autoCapitalize="none"
                  autoComplete="username"
                  className="mt-2 min-h-12 w-full rounded-control border border-white/20 bg-white/10 px-4 text-body text-text-inverse placeholder:text-text-inverse-muted/60 hover:border-white/35 focus:border-accent-orange focus:outline-none"
                  id="admin-username"
                  maxLength={64}
                  name="username"
                  placeholder="Kullanıcı adınız"
                  required
                  spellCheck={false}
                  type="text"
                />
              </div>
              <div>
                <label
                  className="text-label font-semibold text-text-inverse"
                  htmlFor="admin-password"
                >
                  Parola
                </label>
                <div className="relative mt-2">
                  <input
                    autoComplete="current-password"
                    className="min-h-12 w-full rounded-control border border-white/20 bg-white/10 px-4 pr-20 text-body text-text-inverse placeholder:text-text-inverse-muted/60 hover:border-white/35 focus:border-accent-orange focus:outline-none"
                    id="admin-password"
                    maxLength={1024}
                    name="password"
                    placeholder="Parolanız"
                    required
                    type={passwordVisible ? "text" : "password"}
                  />
                  <button
                    aria-controls="admin-password"
                    aria-label={
                      passwordVisible ? "Parolayı gizle" : "Parolayı göster"
                    }
                    className="absolute inset-y-1 right-1 rounded-control px-3 text-xs font-semibold text-text-inverse-muted hover:bg-white/10 hover:text-text-inverse"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    type="button"
                  >
                    {passwordVisible ? "Gizle" : "Göster"}
                  </button>
                </div>
              </div>
              {error ? (
                <p
                  aria-live="polite"
                  className="rounded-control border border-error/50 bg-error/15 px-4 py-3 text-sm text-white"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <button
                className="min-h-control-primary w-full rounded-control bg-accent-orange px-5 text-label font-bold text-on-accent shadow-lg transition-colors hover:bg-orange-dark disabled:cursor-wait disabled:opacity-70"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Doğrulanıyor…" : "Giriş Yap"}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-svh bg-page lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="flex flex-col bg-brand-navy px-5 py-6 text-text-inverse lg:min-h-svh">
        <div className="flex items-center justify-between lg:block">
          <div>
            <p className="text-label font-semibold text-accent-orange">
              Kalite Filo
            </p>
            <p className="mt-1 text-body font-semibold">Yönetim Paneli</p>
          </div>
          <span className="rounded-pill border border-white/20 px-3 py-1 text-xs text-text-inverse-muted">
            {session.environment === "staging" ? "Staging" : "Production"}
          </span>
        </div>
        <nav aria-label="Yönetim" className="mt-8 flex-1 space-y-1">
          <button
            className={`flex min-h-11 w-full items-center rounded-control px-4 text-label font-semibold text-text-inverse ${view === "dashboard" ? "bg-white/10" : ""}`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
          <button
            aria-expanded={vehiclesOpen}
            className="flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10"
            onClick={() => setVehiclesOpen((v) => !v)}
          >
            Araçlar <span className="ml-auto">{vehiclesOpen ? "−" : "+"}</span>
          </button>
          {vehiclesOpen ? (
            <div className="ml-3 border-l border-white/15 pl-2">
              <button
                className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white"
                onClick={() => setView("vehicles")}
              >
                Yayındaki Araçlar
              </button>
              <button
                className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white"
                onClick={() => setView("draftVehicles")}
              >
                Draft Araçlar
              </button>
              <button
                className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white"
                onClick={() => setView("featuredVehicles")}
              >
                Öne Çıkan Araçlar
              </button>
            </div>
          ) : null}
          <button
            aria-expanded={articlesOpen}
            className={`flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10 ${view === "articles" || view === "draftArticles" || view === "featuredArticles" ? "bg-white/10" : ""}`}
            onClick={() => setArticlesOpen((value) => !value)}
          >
            Filo Rehberi <span className="ml-auto">{articlesOpen ? "−" : "+"}</span>
          </button>
          {articlesOpen ? (
            <div className="ml-3 border-l border-white/15 pl-2">
              <button className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white" onClick={() => setView("articles")}>Yayındaki Bloglar</button>
              <button className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white" onClick={() => setView("draftArticles")}>Draft Bloglar</button>
              <button className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white" onClick={() => setView("featuredArticles")}>Öne Çıkan Bloglar</button>
            </div>
          ) : null}
          {(["owner", "admin"].includes(session.user.role)) ? <>
            <button
              aria-expanded={formsOpen}
              className={`flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10 ${view === "quoteForms" || view === "contactForms" ? "bg-white/10" : ""}`}
              onClick={() => setFormsOpen((value) => !value)}
            >
              Formlar <span className="ml-auto">{formsOpen ? "−" : "+"}</span>
            </button>
            {formsOpen ? <div className="ml-3 border-l border-white/15 pl-2">
              <button className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white" onClick={() => setView("quoteForms")}>Teklif Formu</button>
              <button className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white" onClick={() => setView("contactForms")}>İletişim Formu</button>
            </div> : null}
          </> : null}
          <button
            className={`flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10 ${view === "media" ? "bg-white/10" : ""}`}
            onClick={() => setView("media")}
          >
            Medya
          </button>
          <button
            className={`flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10 ${view === "subscribers" ? "bg-white/10" : ""}`}
            onClick={() => setView("subscribers")}
          >
            Bülten Kişileri
          </button>
          <button
            className={`flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10 ${view === "iys" ? "bg-white/10" : ""}`}
            onClick={() => setView("iys")}
          >
            İYS
          </button>
          <button
            className={`flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10 ${view === "campaigns" ? "bg-white/10" : ""}`}
            onClick={() => setView("campaigns")}
          >
            Mail Kampanyaları
          </button>
          <button
            aria-expanded={settingsOpen}
            className="flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10"
            onClick={() => setSettingsOpen((v) => !v)}
          >
            Ayarlar <span className="ml-auto">{settingsOpen ? "−" : "+"}</span>
          </button>
          {settingsOpen ? (
            <div className="ml-3 border-l border-white/15 pl-2">
              <button
                className="flex min-h-10 w-full items-center px-3 text-sm text-text-inverse-muted hover:text-white"
                onClick={() => setView("tags")}
              >
                Etiketler
              </button>
            </div>
          ) : null}
          <button
            className={`flex min-h-11 w-full items-center rounded-control px-4 text-left text-label font-semibold text-text-inverse hover:bg-white/10 ${view === "audit" ? "bg-white/10" : ""}`}
            onClick={() => setView("audit")}
          >
            Denetim Kaydı
          </button>
        </nav>
        <button className={`sticky bottom-4 mt-6 flex min-h-12 w-full items-center justify-center rounded-control bg-accent-orange px-4 text-label font-bold text-on-accent shadow-lg transition hover:bg-orange-dark ${view === "publishing" ? "ring-2 ring-white/70 ring-offset-2 ring-offset-brand-navy" : ""}`} onClick={() => setView("publishing")}>Yayına Al</button>
      </aside>
      <main className="px-gutter py-8 lg:py-10">
        <header className="flex flex-col gap-5 border-b border-border-subtle pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label text-text-secondary">
              Güvenli oturum açık
            </p>
            <h1 className="mt-1 text-heading-md">
              Hoş geldiniz, {session.user.displayName}
            </h1>
          </div>
          <button
            className="min-h-11 rounded-control border border-border-control bg-surface-card px-5 text-label font-semibold hover:border-corporate-blue hover:text-corporate-blue disabled:opacity-60"
            disabled={submitting}
            onClick={handleLogout}
            type="button"
          >
            Oturumu Kapat
          </button>
        </header>
        {error ? (
          <p
            aria-live="polite"
            className="mt-6 rounded-control bg-error-surface px-4 py-3 text-body text-error"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {view === "publishing" ? (
          <PublishingCenter canClearHistory={session.user.role === "owner"} canRequest={["owner", "admin"].includes(session.user.role)} csrfToken={session.csrfToken} />
        ) : view === "quoteForms" || view === "contactForms" ? (
          <FormSubmissionsView kind={view === "quoteForms" ? "quote" : "contact"} csrfToken={session.csrfToken} />
        ) : view === "campaigns" ? (
          <CampaignManager
            canEdit={["owner", "admin", "marketing"].includes(
              session.user.role,
            )}
            canQueue={["owner", "admin"].includes(session.user.role)}
            csrfToken={session.csrfToken}
          />
        ) : view === "iys" ? (
          <IysManagementView
            canExport={["owner", "admin", "marketing"].includes(
              session.user.role,
            )}
            csrfToken={session.csrfToken}
          />
        ) : view === "subscribers" ? (
          <SubscriberListView
            canCorrect={["owner", "admin"].includes(session.user.role)}
            canManage={["owner", "admin", "marketing"].includes(
              session.user.role,
            )}
            csrfToken={session.csrfToken}
          />
        ) : view === "media" ? (
          <MediaLibraryView
            canEdit={["owner", "admin", "editor"].includes(session.user.role)}
            csrfToken={session.csrfToken}
          />
        ) : view === "articles" || view === "draftArticles" ? (
          <ArticleListView
            canEdit={["owner", "admin", "editor"].includes(session.user.role)}
            csrfToken={session.csrfToken}
            draftOnly={view === "draftArticles"}
          />
        ) : view === "featuredArticles" ? (
          <FeaturedArticlesManager csrfToken={session.csrfToken} />
        ) : view === "audit" ? (
          <AuditLogView />
        ) : view === "tags" ? (
          <TagManager csrfToken={session.csrfToken} />
        ) : view === "featuredVehicles" ? (
          <FeaturedVehiclesManager csrfToken={session.csrfToken} />
        ) : view !== "dashboard" ? (
          <VehicleManager
            csrfToken={session.csrfToken}
            draftOnly={view === "draftVehicles"}
          />
        ) : (
          <section className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-label font-semibold text-corporate-blue">
                  Operasyon özeti
                </p>
                <h2 className="mt-1 text-heading-md">Dashboard</h2>
              </div>
              <p className="text-sm text-text-secondary">
                Salt okunur ·{" "}
                {session.environment === "staging"
                  ? "Staging verisi"
                  : "Production verisi"}
              </p>
            </div>
            {dashboardError ? (
              <p
                className="mt-5 rounded-control bg-error-surface px-4 py-3 text-body text-error"
                role="alert"
              >
                {dashboardError}
              </p>
            ) : null}
            {dashboardLoading && !dashboard ? (
              <p className="mt-6 text-body text-text-secondary">
                Metrikler yükleniyor…
              </p>
            ) : null}
            {dashboard ? (
              <>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Aktif araç", dashboard.metrics.activeVehicles],
                    ["Öne çıkan araç", dashboard.metrics.featuredVehicles],
                    ["Filo Rehberi içeriği", dashboard.metrics.articles],
                    ["Draft içerik", dashboard.metrics.draftArticles],
                    ["Newsletter kişisi", dashboard.metrics.newsletterContacts],
                    [
                      "Onaylı pazarlama izni",
                      dashboard.metrics.approvedMarketingConsents,
                    ],
                    ["İYS bekleyen", dashboard.metrics.iysPending],
                    ["Abonelikten çıkan", dashboard.metrics.unsubscribed],
                  ].map(([label, value]) => (
                    <div
                      className="rounded-card border border-border-subtle bg-surface-card p-5 shadow-sm"
                      key={label}
                    >
                      <dt className="text-sm font-medium text-text-secondary">
                        {label}
                      </dt>
                      <dd className="mt-3 text-3xl font-bold tracking-tight text-brand-navy">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.7fr)]">
                  <section className="rounded-card border border-border-subtle bg-surface-card p-6">
                    <h3 className="text-lg font-bold text-brand-navy">
                      Son admin aktiviteleri
                    </h3>
                    {dashboard.recentActivity.length ? (
                      <ul className="mt-4 divide-y divide-border-subtle">
                        {dashboard.recentActivity.map((activity) => (
                          <li
                            className="flex gap-4 py-4 first:pt-1"
                            key={activity.id}
                          >
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 size-2 shrink-0 rounded-full ${activity.result === "success" ? "bg-success" : "bg-error"}`}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-brand-navy">
                                {activityLabels[activity.action] ??
                                  activity.action}
                              </p>
                              <p className="mt-1 text-sm text-text-secondary">
                                {activity.adminId ?? "Anonim"} ·{" "}
                                {formatActivityDate(activity.timestamp)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-body text-text-secondary">
                        Henüz gösterilecek aktivite yok.
                      </p>
                    )}
                  </section>
                  <section className="rounded-card border border-border-subtle bg-surface-card p-6">
                    <h3 className="text-lg font-bold text-brand-navy">
                      Yayın durumu
                    </h3>
                    <dl className="mt-5 space-y-5">
                      <div>
                        <dt className="text-sm text-text-secondary">
                          Son staging publish
                        </dt>
                        <dd className="mt-1 font-semibold">Henüz kayıt yok</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-text-secondary">
                          Son production publish
                        </dt>
                        <dd className="mt-1 font-semibold">Henüz kayıt yok</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-text-secondary">
                          Başarısız işlem
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {dashboard.failures.length}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}
