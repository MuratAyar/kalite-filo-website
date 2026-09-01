"use client";

import { useEffect, useState } from "react";

type Change = { id: string; type: string; label: string; updatedAt: string | null };
type StageName = "materialization" | "validation" | "build" | "release" | "deployment" | "smoke";
type Request = { id: string; status: string; changeCount: number; requestedAt: string; snapshotHash: string; startedAt: string | null; completedAt: string | null; result: { outcome: string; summary: string | null } | null };
type ValidationMessage = { code: string; message: string };

export function PublishingCenter({ csrfToken, canRequest }: { csrfToken: string; canRequest: boolean }) {
  const [changes, setChanges] = useState<Change[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; blockers: ValidationMessage[]; warnings: ValidationMessage[] }>({ valid: false, blockers: [], warnings: [] });
  const [reporting, setReporting] = useState<Request | null>(null);
  const [runnerForm, setRunnerForm] = useState({ outcome: "succeeded", failedStage: "build" as StageName, manifestHash: "", artifactHash: "", summary: "" });

  async function load() {
    try {
      const response = await fetch("/admin-api/publishing.php", { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.changes) || !Array.isArray(payload.requests) || typeof payload.validation !== "object" || payload.validation === null) throw new Error();
      setChanges(payload.changes); setRequests(payload.requests); setValidation(payload.validation); setError(""); if (payload.changes.length > 0) setNotice("");
    } catch { setError("Yayına alma durumu yüklenemedi."); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);

  async function requestStaging() {
    if (changes.length === 0) { setNotice("Henüz yayınlanacak bir güncelleme yapılmadı."); setError(""); return; }
    setNotice("");
    if (window.prompt("Staging talebini dondurmak için STAGING yazın.") !== "STAGING") return;
    setSubmitting(true);
    try {
      const response = await fetch("/admin-api/publish-staging.php", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ confirmation: "STAGING" }) });
      if (!response.ok) throw new Error();
      await load();
    } catch { setError("Staging yayına alma talebi oluşturulamadı."); }
    finally { setSubmitting(false); }
  }

  async function runnerTransition(request: Request, action: "start" | "complete") {
    setSubmitting(true); setError("");
    try {
      const stageNames: StageName[] = ["materialization", "validation", "build", "release", "deployment", "smoke"];
      const failedIndex = stageNames.indexOf(runnerForm.failedStage);
      const stages = Object.fromEntries(stageNames.map((stage, index) => [stage, runnerForm.outcome === "succeeded" ? "passed" : index < failedIndex ? "passed" : index === failedIndex ? "failed" : "skipped"]));
      const body = action === "start" ? { id: request.id, snapshotHash: request.snapshotHash, action } : { id: request.id, snapshotHash: request.snapshotHash, action, result: { outcome: runnerForm.outcome, manifestHash: runnerForm.manifestHash.trim().toLowerCase(), artifactHash: runnerForm.artifactHash.trim().toLowerCase(), stages, summary: runnerForm.summary.trim() } };
      const response = await fetch("/admin-api/publish-runner-result.php", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      setReporting(null); setRunnerForm({ outcome: "succeeded", failedStage: "build", manifestHash: "", artifactHash: "", summary: "" }); await load();
    } catch { setError("Runner durumu kaydedilemedi. Request kimliği, hash değerleri ve aşama sonucunu kontrol edin."); }
    finally { setSubmitting(false); }
  }

  return <section className="mt-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-label font-semibold text-corporate-blue">Kontrollü yayın akışı</p><h2 className="mt-1 text-heading-md">Yayına Al</h2><p className="mt-2 max-w-3xl text-sm text-text-secondary">Private değişiklikler burada dondurulur. Build güvenilir yönetici bilgisayarında, staging kurulumu cPanel File Manager ve Terminal üzerinden doğrulanmış release paketiyle yapılır.</p></div>{canRequest ? <button aria-disabled={changes.length === 0} className={`min-h-11 rounded-control bg-accent-orange px-5 font-bold disabled:opacity-50 ${changes.length === 0 ? "cursor-not-allowed opacity-60" : ""}`} disabled={submitting || loading || changes.length > 0 && !validation.valid} onClick={() => void requestStaging()} type="button">{submitting ? "Donduruluyor..." : "Staging Talebi Oluştur"}</button> : null}</div>
    {error ? <p className="mt-5 rounded-control bg-error-surface p-4 text-error">{error}</p> : null}
    {notice ? <p className="mt-5 rounded-control border border-accent-orange/30 bg-accent-orange/10 p-4 text-sm font-semibold" role="status">{notice}</p> : null}
    {validation.blockers.length ? <section className="mt-5 rounded-card border border-error/30 bg-error-surface p-5"><h3 className="font-bold text-error">Yayınlamayı engelleyen kontroller</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-error">{validation.blockers.map((item) => <li key={item.code}>{item.message}</li>)}</ul></section> : null}
    {validation.warnings.length ? <section className="mt-5 rounded-card border border-accent-orange/30 bg-accent-orange/10 p-5"><h3 className="font-bold">Uyarılar</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{validation.warnings.map((item) => <li key={item.code}>{item.message}</li>)}</ul></section> : null}
    {loading ? <p className="mt-6 text-text-secondary">Yükleniyor...</p> : <><section className="mt-6 rounded-card border bg-surface-card p-5"><h3 className="text-lg font-bold">Yayınlanmamış Değişiklikler ({changes.length})</h3>{changes.length ? <ul className="mt-4 divide-y">{changes.map((change) => <li className="flex justify-between gap-4 py-3" key={change.id}><div><p className="font-semibold">{change.label}</p><p className="text-xs text-text-secondary">{change.type}</p></div><time className="text-sm text-text-secondary">{change.updatedAt ? new Date(change.updatedAt).toLocaleString("tr-TR") : "—"}</time></li>)}</ul> : <p className="mt-4 text-sm text-text-secondary">Yayınlanmamış private değişiklik yok.</p>}</section>{requests.some((request)=>request.status==="awaiting_runner")?<section className="mt-6 rounded-card border border-accent-orange/40 bg-accent-orange/10 p-5"><h3 className="font-bold">Runner aktarımı bekleniyor</h3><p className="mt-2 text-sm text-text-secondary">Dondurulan snapshot yalnızca yetkili yönetici tarafından indirilebilir. Build bilgisayarı request dosyasını ve cPanel File Manager ile indirilen ilgili private medyayı doğrulayıp staging release paketini üretmelidir. İndirme tek başına build veya deployment başlatmaz.</p></section>:null}<section className="mt-6 rounded-card border bg-surface-card p-5"><h3 className="text-lg font-bold">Staging Talep Geçmişi</h3>{requests.length ? <ul className="mt-4 divide-y">{requests.map((request) => <li className="grid items-center gap-2 py-3 text-sm md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]" key={request.id}><div className="min-w-0"><strong className="block truncate">{request.id}</strong><span className="block truncate text-xs text-text-secondary" title={request.snapshotHash}>{request.snapshotHash.slice(0,12)}…</span></div><span>{request.status}</span><span>{request.changeCount} değişiklik</span><time>{new Date(request.requestedAt).toLocaleString("tr-TR")}</time>{canRequest ? <div className="flex flex-wrap gap-2"><a className="inline-flex min-h-10 items-center justify-center rounded-control border border-corporate-blue px-3 font-semibold text-corporate-blue" href={`/admin-api/publish-request-download.php?id=${encodeURIComponent(request.id)}`}>Snapshot İndir</a>{request.status === "awaiting_runner" ? <button className="min-h-10 rounded-control bg-corporate-blue px-3 font-semibold text-white disabled:opacity-50" disabled={submitting} onClick={() => void runnerTransition(request, "start")} type="button">Runner Başlat</button> : null}{request.status === "running" ? <button className="min-h-10 rounded-control bg-accent-orange px-3 font-semibold" onClick={() => setReporting(request)} type="button">Sonuç Gir</button> : null}</div> : null}</li>)}</ul> : <p className="mt-4 text-sm text-text-secondary">Henüz staging yayın talebi yok.</p>}</section></>}
    {reporting ? <section className="mt-6 rounded-card border border-corporate-blue/30 bg-surface-card p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold">Runner Sonucu</h3><p className="mt-1 text-xs text-text-secondary">{reporting.id} · {reporting.snapshotHash.slice(0,12)}…</p></div><button className="min-h-10 rounded-control border px-3" onClick={() => setReporting(null)} type="button">Kapat</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Sonuç<select className="mt-1 min-h-11 w-full rounded-control border border-border-control px-3" onChange={(event)=>setRunnerForm((current)=>({...current,outcome:event.target.value}))} value={runnerForm.outcome}><option value="succeeded">Başarılı</option><option value="failed">Başarısız</option></select></label>{runnerForm.outcome === "failed" ? <label className="text-sm font-semibold">Başarısız aşama<select className="mt-1 min-h-11 w-full rounded-control border border-border-control px-3" onChange={(event)=>setRunnerForm((current)=>({...current,failedStage:event.target.value as StageName}))} value={runnerForm.failedStage}><option value="materialization">Materialization</option><option value="validation">Validation</option><option value="build">Build</option><option value="release">Release</option><option value="deployment">Deployment</option><option value="smoke">Smoke test</option></select></label> : null}<label className="text-sm font-semibold">Review manifest SHA-256<input className="mt-1 min-h-11 w-full rounded-control border border-border-control px-3 font-mono text-xs" maxLength={64} onChange={(event)=>setRunnerForm((current)=>({...current,manifestHash:event.target.value}))} value={runnerForm.manifestHash}/></label><label className="text-sm font-semibold">Staging ZIP SHA-256 {runnerForm.outcome === "succeeded" ? "*" : "(varsa)"}<input className="mt-1 min-h-11 w-full rounded-control border border-border-control px-3 font-mono text-xs" maxLength={64} onChange={(event)=>setRunnerForm((current)=>({...current,artifactHash:event.target.value}))} value={runnerForm.artifactHash}/></label><label className="text-sm font-semibold md:col-span-2">Güvenli kısa not<textarea className="mt-1 min-h-24 w-full rounded-control border border-border-control p-3" maxLength={300} onChange={(event)=>setRunnerForm((current)=>({...current,summary:event.target.value}))} value={runnerForm.summary}/></label></div><button className="mt-5 min-h-11 rounded-control bg-accent-orange px-5 font-bold disabled:opacity-50" disabled={submitting || !/^[a-f0-9]{64}$/i.test(runnerForm.manifestHash) || runnerForm.outcome === "succeeded" && !/^[a-f0-9]{64}$/i.test(runnerForm.artifactHash)} onClick={() => void runnerTransition(reporting, "complete")} type="button">Sonucu Kaydet</button></section> : null}
  </section>;
}
