"use client";

import { useCallback, useEffect, useState } from "react";

type ChangeField = { label: string; before: string; after: string };
type ChangeDetail = { entity: string; action: "created" | "updated" | "removed" | "reordered"; fields: ChangeField[] };
type Change = { id: string; type: string; label: string; updatedAt: string | null; details?: ChangeDetail[] };
type Automation = { enabled: boolean; ready: boolean; provider: "github_actions"; missing: string[] };
type PublishAutomation = { status?: string; runUrl?: string | null; updatedAt?: string | null };
type PublishRequest = {
  id: string;
  status: string;
  changeCount: number;
  requestedAt: string;
  snapshotHash: string;
  completedAt: string | null;
  result: { outcome: string; summary: string | null } | null;
  automation: PublishAutomation | null;
  changes: Change[];
};
type ValidationMessage = { code: string; message: string };

const statusLabels: Record<string, string> = {
  awaiting_runner: "Runner bekleniyor",
  running: "Build çalışıyor",
  staging_succeeded: "Staging hazır",
  failed: "Başarısız",
  dispatching: "Başlatılıyor",
  queued: "GitHub Actions sırasında",
  dispatch_failed: "Başlatılamadı",
  deploying: "Staging kuruluyor",
  succeeded: "Tamamlandı",
};

const actionLabels: Record<ChangeDetail["action"], string> = {
  created: "Oluşturuldu",
  updated: "Güncellendi",
  removed: "Kaldırıldı",
  reordered: "Sıralama değişti",
};

function requestStatus(request: PublishRequest) {
  return request.automation?.status
    ? statusLabels[request.automation.status] ?? request.automation.status
    : statusLabels[request.status] ?? request.status;
}

export function PublishingCenter({ csrfToken, canRequest, canClearHistory }: { csrfToken: string; canRequest: boolean; canClearHistory: boolean }) {
  const [changes, setChanges] = useState<Change[]>([]);
  const [requests, setRequests] = useState<PublishRequest[]>([]);
  const [automation, setAutomation] = useState<Automation>({ enabled: false, ready: false, provider: "github_actions", missing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [historyAction, setHistoryAction] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [historyAvailable, setHistoryAvailable] = useState(true);
  const [validation, setValidation] = useState<{ valid: boolean; blockers: ValidationMessage[]; warnings: ValidationMessage[] }>({ valid: false, blockers: [], warnings: [] });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/admin-api/publishing.php", { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.changes) || !Array.isArray(payload.requests) || typeof payload.validation !== "object" || typeof payload.automation !== "object") throw new Error();
      setChanges(payload.changes);
      setRequests(payload.requests);
      setValidation(payload.validation);
      setAutomation(payload.automation);
      setCurrentRequestId(typeof payload.currentRequestId === "string" ? payload.currentRequestId : null);
      setHistoryAvailable(payload.historyAvailable !== false);
      setError("");
    } catch {
      setError("Yayına alma durumu yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 8000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [load]);

  async function publishStaging() {
    if (changes.length === 0) {
      setNotice("Henüz yayınlanacak bir güncelleme yapılmadı.");
      setError("");
      return;
    }
    if (!automation.ready) {
      setError("Otomatik staging servisi henüz yapılandırılmadı.");
      return;
    }
    if (!window.confirm(`${changes.length} değişiklik doğrulanıp staging ortamına otomatik olarak alınsın mı?`)) return;
    setSubmitting(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/admin-api/publish-staging.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ confirmation: "STAGING" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (payload?.error === "automation_not_ready") throw new Error("Otomatik staging servisi hazır değil. Eksik PHP özellikleri veya private ayarlar kontrol edilmeli.");
        if (payload?.error === "automation_dispatch_failed") throw new Error("GitHub Actions build işlemi başlatılamadı. Private GitHub token ayarını kontrol edin.");
        throw new Error("Staging oluşturma işlemi başlatılamadı.");
      }
      await load();
      setNotice(payload?.alreadyRunning === true
        ? "Bu değişiklikler için staging işlemi zaten devam ediyor."
        : "Staging oluşturma işlemi başlatıldı. Durum bu sayfada otomatik güncellenecek.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Staging oluşturma işlemi başlatılamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  async function clearHistory() {
    if (!window.confirm("Eski staging geçmişi ve süresi dolmuş yarım işlemler silinsin mi? Güncel sürüm ve yakın tarihli aktif işlemler korunacaktır.")) return;
    setHistoryAction("clear"); setError(""); setNotice("");
    try {
      const response = await fetch("/admin-api/publishing-history.php", { method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ confirmation: "GEÇMİŞİ SİL" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error("Staging geçmişi silinemedi.");
      await load();
      setNotice(`${payload.deleted ?? 0} geçmiş kaydı silindi.${payload.deletedStale ? ` Bunların ${payload.deletedStale} adedi süresi dolmuş yarım işlemdi.` : ""}${payload.preservedCurrent ? " Güncel sürüm korundu." : ""}${payload.preservedActive ? ` ${payload.preservedActive} yakın tarihli aktif işlem korundu.` : ""}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Staging geçmişi silinemedi."); }
    finally { setHistoryAction(""); }
  }

  async function restoreRequest(request: PublishRequest) {
    if (!window.confirm(`${request.id} sürümü staging ortamında yeniden etkinleştirilsin mi? Mevcut staging sürümü geri dönüş için korunacaktır.`)) return;
    setHistoryAction(request.id); setError(""); setNotice("");
    try {
      const response = await fetch("/admin-api/publish-restore.php", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ requestId: request.id, confirmation: "STAGING GERİ AL" }) });
      const payload = await response.json();
      if (!response.ok) {
        if (payload?.error === "release_unavailable") throw new Error("Bu staging sürümünün saklanan release dosyası artık mevcut değil.");
        throw new Error("Seçilen staging sürümüne geri dönülemedi.");
      }
      await load();
      setNotice(payload.alreadyActive ? "Bu staging sürümü zaten etkin." : "Seçilen staging sürümü yeniden etkinleştirildi.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Seçilen staging sürümüne geri dönülemedi."); }
    finally { setHistoryAction(""); }
  }

  const actionUnavailable = submitting || loading || changes.length > 0 && (!validation.valid || !automation.ready);

  return <section className="mt-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-label font-semibold text-corporate-blue">Kontrollü yayın akışı</p>
        <h2 className="mt-1 text-heading-md">Yayına Al</h2>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary">Değişiklikler doğrulanır, GitHub Actions üzerinde statik release oluşturulur ve staging ortamına otomatik olarak kurulur. Başarısız kurulumda önceki sürüm korunur.</p>
      </div>
      {canRequest ? <button
        aria-disabled={changes.length === 0 || actionUnavailable}
        className={`min-h-11 rounded-control bg-accent-orange px-5 font-bold disabled:opacity-50 ${changes.length === 0 ? "cursor-not-allowed opacity-60" : ""}`}
        disabled={actionUnavailable}
        onClick={() => void publishStaging()}
        type="button"
      >{submitting ? "Başlatılıyor..." : "Staging Oluştur"}</button> : null}
    </div>

    {error ? <p className="mt-5 rounded-control bg-error-surface p-4 text-error" role="alert">{error}</p> : null}
    {notice ? <p className="mt-5 rounded-control border border-accent-orange/30 bg-accent-orange/10 p-4 text-sm font-semibold" role="status">{notice}</p> : null}
    {!automation.ready ? <section className="mt-5 rounded-card border border-accent-orange/30 bg-accent-orange/10 p-5">
      <h3 className="font-bold">Otomatik staging kurulumu bekliyor</h3>
      <p className="mt-2 text-sm text-text-secondary">Bir defalık private cPanel ve GitHub Actions ayarları tamamlandığında bu sayfadan doğrudan staging oluşturabilirsiniz.</p>
      {automation.missing.length > 0 ? <p className="mt-2 text-xs text-text-secondary">Eksik sunucu özellikleri: {automation.missing.join(", ")}</p> : null}
    </section> : null}
    {validation.blockers.length > 0 ? <section className="mt-5 rounded-card border border-error/30 bg-error-surface p-5">
      <h3 className="font-bold text-error">Yayınlamayı engelleyen kontroller</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-error">{validation.blockers.map((item) => <li key={item.code}>{item.message}</li>)}</ul>
    </section> : null}
    {validation.warnings.length > 0 ? <section className="mt-5 rounded-card border border-accent-orange/30 bg-accent-orange/10 p-5">
      <h3 className="font-bold">Uyarılar</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{validation.warnings.map((item) => <li key={item.code}>{item.message}</li>)}</ul>
    </section> : null}

    {loading ? <p className="mt-6 text-text-secondary">Yükleniyor...</p> : <>
      <section className="mt-6 rounded-card border bg-surface-card p-5">
        <h3 className="text-lg font-bold">Yayınlanmamış Değişiklikler ({changes.length})</h3>
        {changes.length > 0 ? <ul className="mt-4 divide-y">{changes.map((change) => <li className="flex justify-between gap-4 py-3" key={change.id}>
          <div><p className="font-semibold">{change.label}</p><p className="text-xs text-text-secondary">{change.type}</p></div>
          <time className="text-sm text-text-secondary">{change.updatedAt ? new Date(change.updatedAt).toLocaleString("tr-TR") : "—"}</time>
        </li>)}</ul> : <p className="mt-4 text-sm text-text-secondary">Staging’e aktarılmayı bekleyen değişiklik yok.</p>}
      </section>

      <section className="mt-6 rounded-card border bg-surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold">Staging Geçmişi</h3><p className="mt-1 text-sm text-text-secondary">Yayın ayrıntılarını inceleyin veya saklanan başarılı bir staging sürümüne geri dönün.</p></div>{canClearHistory && requests.length > 0 ? <button className="min-h-10 rounded-control border border-error/40 px-3 text-sm font-semibold text-error disabled:opacity-50" disabled={historyAction !== ""} onClick={() => void clearHistory()} type="button">{historyAction === "clear" ? "Siliniyor..." : "Geçmişi Temizle"}</button> : null}</div>
        {!historyAvailable ? <p className="mt-4 rounded-control border border-accent-orange/30 bg-accent-orange/10 p-3 text-sm">Yayın geçmişindeki hasarlı bir kayıt atlandı. Yeni staging oluşturma kontrolleri kullanılabilir durumda.</p> : null}
        {requests.length > 0 ? <ul className="mt-4 divide-y">{requests.map((request) => <li className="grid items-center gap-2 py-3 text-sm md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]" key={request.id}>
          <div className="min-w-0"><strong className="block truncate">{request.id}</strong><span className="block truncate text-xs text-text-secondary" title={request.snapshotHash}>{request.snapshotHash.slice(0, 12)}…</span></div>
          <span className="font-semibold">{requestStatus(request)}</span>
          <span>{request.changeCount} değişiklik</span>
          <time>{new Date(request.requestedAt).toLocaleString("tr-TR")}</time>
          <div className="flex flex-wrap gap-2">
            {request.automation?.runUrl ? <a className="inline-flex min-h-10 items-center justify-center rounded-control border border-corporate-blue px-3 font-semibold text-corporate-blue" href={request.automation.runUrl} rel="noreferrer" target="_blank">Build Detayı</a> : null}
            <a className="inline-flex min-h-10 items-center justify-center rounded-control border px-3 font-semibold" href={`/admin-api/publish-request-download.php?id=${encodeURIComponent(request.id)}`}>Snapshot</a>
            {request.status === "staging_succeeded" && request.id === currentRequestId
              ? <span className="inline-flex min-h-10 items-center justify-center rounded-control border border-success/30 bg-success/10 px-3 font-semibold text-success" title="Staging ortamında şu anda etkin olan sürüm">Güncel Sürüm</span>
              : canRequest && request.status === "staging_succeeded" ? <button className="min-h-10 rounded-control bg-corporate-blue px-3 font-semibold text-white disabled:opacity-50" disabled={historyAction !== ""} onClick={() => void restoreRequest(request)} type="button">{historyAction === request.id ? "Geri dönülüyor..." : "Bu Sürüme Dön"}</button> : null}
          </div>
          {request.result?.summary ? <p className="text-xs text-text-secondary md:col-span-5">{request.result.summary}</p> : null}
          <details className="md:col-span-5">
            <summary className="cursor-pointer font-semibold text-corporate-blue">Değişiklik detayları ({request.changes.length})</summary>
            {request.changes.length > 0 ? <ul className="mt-3 grid gap-3">{request.changes.map((change) => <li className="rounded-control border bg-surface-muted p-4" key={change.id}>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{change.label}</span><span className="text-xs text-text-secondary">{change.updatedAt ? new Date(change.updatedAt).toLocaleString("tr-TR") : change.type}</span></div>
              {change.details && change.details.length > 0 ? <ul className="mt-3 grid gap-3 md:grid-cols-2">{change.details.map((detail, detailIndex) => <li className="rounded-control border bg-surface-card p-3" key={`${change.id}-${detailIndex}`}>
                <div className="flex flex-wrap items-center justify-between gap-2"><strong>{detail.entity}</strong><span className="rounded-full bg-corporate-blue/10 px-2 py-1 text-xs font-semibold text-corporate-blue">{actionLabels[detail.action]}</span></div>
                {detail.fields.length > 0 ? <dl className="mt-3 space-y-2">{detail.fields.map((field, fieldIndex) => <div className="grid gap-1 border-t pt-2 text-xs sm:grid-cols-[8rem_1fr]" key={`${field.label}-${fieldIndex}`}><dt className="font-semibold text-text-secondary">{field.label}</dt><dd className="flex min-w-0 flex-wrap items-center gap-2"><span className="break-all text-text-secondary line-through">{field.before}</span><span aria-hidden="true">→</span><strong className="break-all text-text-primary">{field.after}</strong></dd></div>)}</dl> : null}
              </li>)}</ul> : <p className="mt-3 text-xs text-text-secondary">Bu eski kayıtta alan bazlı değişiklik bilgisi bulunmuyor.</p>}
            </li>)}</ul> : <p className="mt-2 text-sm text-text-secondary">Bu kayıtta değişiklik detayı bulunmuyor.</p>}
          </details>
        </li>)}</ul> : <p className="mt-4 text-sm text-text-secondary">Henüz staging yayını yok.</p>}
      </section>
    </>}
  </section>;
}
