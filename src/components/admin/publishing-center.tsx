"use client";

import { useEffect, useState } from "react";

type Change = { id: string; type: string; label: string; updatedAt: string | null };
type Request = { id: string; status: string; changeCount: number; requestedAt: string };
type ValidationMessage = { code: string; message: string };

export function PublishingCenter({ csrfToken, canRequest }: { csrfToken: string; canRequest: boolean }) {
  const [changes, setChanges] = useState<Change[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; blockers: ValidationMessage[]; warnings: ValidationMessage[] }>({ valid: false, blockers: [], warnings: [] });

  async function load() {
    try {
      const response = await fetch("/admin-api/publishing.php", { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.changes) || !Array.isArray(payload.requests) || typeof payload.validation !== "object" || payload.validation === null) throw new Error();
      setChanges(payload.changes); setRequests(payload.requests); setValidation(payload.validation); setError("");
    } catch { setError("Yayınlama durumu yüklenemedi."); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);

  async function requestStaging() {
    if (window.prompt("Staging talebini dondurmak için STAGING yazın.") !== "STAGING") return;
    setSubmitting(true);
    try {
      const response = await fetch("/admin-api/publish-staging.php", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ confirmation: "STAGING" }) });
      if (!response.ok) throw new Error();
      await load();
    } catch { setError("Staging yayın talebi oluşturulamadı."); }
    finally { setSubmitting(false); }
  }

  return <section className="mt-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-label font-semibold text-corporate-blue">Kontrollü yayın akışı</p><h2 className="mt-1 text-heading-md">Yayınlama</h2><p className="mt-2 max-w-3xl text-sm text-text-secondary">Private değişiklikler burada dondurulur. Build ve deploy daha sonra bağlanacak harici runner üzerinde mevcut release komutlarıyla çalışacaktır.</p></div>{canRequest ? <button className="min-h-11 rounded-control bg-accent-orange px-5 font-bold disabled:opacity-50" disabled={submitting || changes.length === 0 || !validation.valid} onClick={() => void requestStaging()} type="button">{submitting ? "Donduruluyor..." : "Staging Talebi Oluştur"}</button> : null}</div>
    {error ? <p className="mt-5 rounded-control bg-error-surface p-4 text-error">{error}</p> : null}
    {validation.blockers.length ? <section className="mt-5 rounded-card border border-error/30 bg-error-surface p-5"><h3 className="font-bold text-error">Yayınlamayı engelleyen kontroller</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-error">{validation.blockers.map((item) => <li key={item.code}>{item.message}</li>)}</ul></section> : null}
    {validation.warnings.length ? <section className="mt-5 rounded-card border border-accent-orange/30 bg-accent-orange/10 p-5"><h3 className="font-bold">Uyarılar</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{validation.warnings.map((item) => <li key={item.code}>{item.message}</li>)}</ul></section> : null}
    {loading ? <p className="mt-6 text-text-secondary">Yükleniyor...</p> : <><section className="mt-6 rounded-card border bg-surface-card p-5"><h3 className="text-lg font-bold">Yayınlanmamış Değişiklikler ({changes.length})</h3>{changes.length ? <ul className="mt-4 divide-y">{changes.map((change) => <li className="flex justify-between gap-4 py-3" key={change.id}><div><p className="font-semibold">{change.label}</p><p className="text-xs text-text-secondary">{change.type}</p></div><time className="text-sm text-text-secondary">{change.updatedAt ? new Date(change.updatedAt).toLocaleString("tr-TR") : "—"}</time></li>)}</ul> : <p className="mt-4 text-sm text-text-secondary">Yayınlanmamış private değişiklik yok.</p>}</section><section className="mt-6 rounded-card border bg-surface-card p-5"><h3 className="text-lg font-bold">Staging Talep Geçmişi</h3>{requests.length ? <ul className="mt-4 divide-y">{requests.map((request) => <li className="grid gap-2 py-3 text-sm md:grid-cols-4" key={request.id}><strong>{request.id}</strong><span>{request.status}</span><span>{request.changeCount} değişiklik</span><time>{new Date(request.requestedAt).toLocaleString("tr-TR")}</time></li>)}</ul> : <p className="mt-4 text-sm text-text-secondary">Henüz staging yayın talebi yok.</p>}</section></>}
  </section>;
}
