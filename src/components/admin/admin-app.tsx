"use client";

import { FormEvent, useEffect, useState } from "react";

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

const endpoints = {
  session: "/admin-api/session.php",
  login: "/admin-api/login.php",
  logout: "/admin-api/logout.php",
} as const;

async function readResponse(response: Response): Promise<Record<string, unknown>> {
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

function messageForError(error: unknown): string {
  if (error === "invalid_credentials") {
    return "Kullanıcı adı veya parola doğrulanamadı.";
  }
  if (error === "login_rate_limited") {
    return "Çok fazla başarısız deneme yapıldı. Lütfen daha sonra tekrar deneyin.";
  }
  if (error === "csrf_failed") {
    return "Güvenlik oturumu yenilenemedi. Sayfayı yeniden yükleyin.";
  }
  return "Yönetim servisine şu anda ulaşılamıyor.";
}

export function AdminApp() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setError(
        "Giriş servisi bu yerel Next.js önizlemesinde çalışmıyor. Kimlik doğrulamak için PHP içeren staging release’i kullanın.",
      );
      return;
    }
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
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
        setError(messageForError(payload.error));
        return;
      }
      event.currentTarget.reset();
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
        setError(messageForError(payload.error));
        return;
      }
      const bootstrapResponse = await fetch(endpoints.session, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const parsed = parseSession(await readResponse(bootstrapResponse));
      if (!bootstrapResponse.ok || !parsed) throw new Error("session_unavailable");
      setSession(parsed);
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
        <img alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover opacity-35" height="720" src="/images/home/fleet-campus.jpg" width="1280" />
        <div aria-hidden="true" className="absolute inset-0 bg-brand-navy/75" />
        <p aria-live="polite" className="relative rounded-pill border border-white/15 bg-brand-navy/80 px-5 py-3 text-label text-text-inverse-muted">
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
        <img alt="" aria-hidden="true" className="absolute inset-0 size-full scale-[1.03] object-cover" height="720" src="/images/home/fleet-campus.jpg" width="1280" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(120deg,rgb(5_13_31_/_0.9),rgb(24_33_54_/_0.7)_52%,rgb(5_13_31_/_0.86))]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-brand-navy to-transparent" />

        <section aria-label="Admin girişi" className="relative w-full max-w-[31rem] overflow-hidden rounded-panel border border-white/15 bg-brand-navy/95 shadow-[0_2rem_5rem_rgb(0_0_0_/_0.38)] backdrop-blur-md">
          <div className="p-6 sm:p-9">
            <h1 className="sr-only">Admin girişi</h1>
            <div className="mb-8">
              <div className="w-fit rounded-control bg-white px-3 py-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Kalite Filo" className="h-auto w-36" height="112" src="/images/brand/kalite-filo-logo.png" width="560" />
              </div>
            </div>

            <div className="mb-7">
              <p className="text-label font-semibold tracking-[0.08em] text-accent-orange uppercase">Yetkili erişimi</p>
            </div>

            {!serviceAvailable ? (
              <div className="mb-5 rounded-control border border-accent-orange/35 bg-accent-orange/10 px-4 py-3 text-sm text-orange-light">
                Arayüz hazır. Giriş doğrulaması PHP içeren staging/release ortamında etkinleşir.
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="text-label font-semibold text-text-inverse" htmlFor="admin-username">Kullanıcı adı</label>
              <input autoCapitalize="none" autoComplete="username" className="mt-2 min-h-12 w-full rounded-control border border-white/20 bg-white/10 px-4 text-body text-text-inverse placeholder:text-text-inverse-muted/60 hover:border-white/35 focus:border-accent-orange focus:outline-none" id="admin-username" maxLength={64} name="username" placeholder="Kullanıcı adınız" required spellCheck={false} type="text" />
            </div>
            <div>
              <label className="text-label font-semibold text-text-inverse" htmlFor="admin-password">Parola</label>
              <div className="relative mt-2">
                <input autoComplete="current-password" className="min-h-12 w-full rounded-control border border-white/20 bg-white/10 px-4 pr-20 text-body text-text-inverse placeholder:text-text-inverse-muted/60 hover:border-white/35 focus:border-accent-orange focus:outline-none" id="admin-password" maxLength={1024} name="password" placeholder="Parolanız" required type={passwordVisible ? "text" : "password"} />
                <button aria-controls="admin-password" aria-label={passwordVisible ? "Parolayı gizle" : "Parolayı göster"} className="absolute inset-y-1 right-1 rounded-control px-3 text-xs font-semibold text-text-inverse-muted hover:bg-white/10 hover:text-text-inverse" onClick={() => setPasswordVisible((visible) => !visible)} type="button">
                  {passwordVisible ? "Gizle" : "Göster"}
                </button>
              </div>
            </div>
            {error ? <p aria-live="polite" className="rounded-control border border-error/50 bg-error/15 px-4 py-3 text-sm text-white" role="alert">{error}</p> : null}
            <button className="min-h-control-primary w-full rounded-control bg-accent-orange px-5 text-label font-bold text-on-accent shadow-lg transition-colors hover:bg-orange-dark disabled:cursor-wait disabled:opacity-70" disabled={submitting} type="submit">
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
      <aside className="bg-brand-navy px-5 py-6 text-text-inverse lg:min-h-svh">
        <div className="flex items-center justify-between lg:block">
          <div>
            <p className="text-label font-semibold text-accent-orange">Kalite Filo</p>
            <p className="mt-1 text-body font-semibold">Yönetim Paneli</p>
          </div>
          <span className="rounded-pill border border-white/20 px-3 py-1 text-xs text-text-inverse-muted">
            {session.environment === "staging" ? "Staging" : "Production"}
          </span>
        </div>
        <nav aria-label="Yönetim" className="mt-8">
          <a aria-current="page" className="flex min-h-11 items-center rounded-control bg-white/10 px-4 text-label font-semibold text-text-inverse" href="/admin/">Dashboard</a>
        </nav>
      </aside>
      <main className="px-gutter py-8 lg:py-10">
        <header className="flex flex-col gap-5 border-b border-border-subtle pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label text-text-secondary">Güvenli oturum açık</p>
            <h1 className="mt-1 text-heading-md">Hoş geldiniz, {session.user.displayName}</h1>
          </div>
          <button className="min-h-11 rounded-control border border-border-control bg-surface-card px-5 text-label font-semibold hover:border-corporate-blue hover:text-corporate-blue disabled:opacity-60" disabled={submitting} onClick={handleLogout} type="button">Oturumu Kapat</button>
        </header>
        {error ? <p aria-live="polite" className="mt-6 rounded-control bg-error-surface px-4 py-3 text-body text-error" role="alert">{error}</p> : null}
        <section className="mt-8 rounded-card border border-border-subtle bg-surface-card p-6 sm:p-8">
          <p className="text-label font-semibold text-corporate-blue">Phase 1 Foundation</p>
          <h2 className="mt-2 text-heading-md">Yönetim sınırı hazır</h2>
          <p className="mt-3 max-w-3xl text-body text-text-secondary">
            Kimlik doğrulama ve statik admin kabuğu etkin. Operasyonel dashboard metrikleri ve salt okunur veri görünümleri Phase 2’de doğrulanmış kaynaklara bağlanacak.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-control bg-surface-muted p-4"><dt className="text-label text-text-secondary">Rol</dt><dd className="mt-1 font-semibold">{session.user.role}</dd></div>
            <div className="rounded-control bg-surface-muted p-4"><dt className="text-label text-text-secondary">Kullanıcı</dt><dd className="mt-1 font-semibold">{session.user.username}</dd></div>
          </dl>
        </section>
      </main>
    </div>
  );
}
