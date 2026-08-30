"use client";

import { FormEvent, useEffect, useState } from "react";

type AuditRecord = { id: string; timestamp: string; adminId: string | null; role: string | null; action: string; entityType: string; entityId: string | null; result: string };
type AuditPage = { records: AuditRecord[]; page: number; limit: number; hasNext: boolean };

const actionLabels: Record<string, string> = {
  login: "Oturum açıldı", logout: "Oturum kapatıldı", failed_login: "Başarısız giriş",
  vehicle_create: "Araç oluşturuldu", vehicle_update: "Araç güncellendi",
  vehicle_image_update: "Araç görseli güncellendi", vehicle_image_delete: "Araç görseli silindi",
  featured_vehicle_change: "Öne çıkan araçlar değiştirildi",
  vehicle_tag_create: "Etiket oluşturuldu", vehicle_tag_update: "Etiket güncellendi", vehicle_tag_delete: "Etiket silindi",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Tarih bilinmiyor" : new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AuditLogView() {
  const [data, setData] = useState<AuditPage | null>(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [pendingFilters, setPendingFilters] = useState({ action: "", result: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (action) query.set("action", action); if (result) query.set("result", result);
    void fetch(`/admin-api/audit.php?${query}`, { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok || !Array.isArray(payload.records)) throw new Error("unavailable"); if (active) setData(payload); })
      .catch(() => { if (active) setError("Denetim kayıtları şu anda yüklenemiyor."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, action, result]);

  function applyFilters(event: FormEvent) {
    event.preventDefault(); setError("");
    if (page === 1 && action === pendingFilters.action && result === pendingFilters.result) return;
    setLoading(true); setPage(1); setAction(pendingFilters.action); setResult(pendingFilters.result);
  }

  return <section className="mt-8">
    <div><p className="text-label font-semibold text-corporate-blue">Güvenlik ve operasyon</p><h2 className="mt-1 text-heading-md">Denetim Kaydı</h2><p className="mt-2 text-body text-text-secondary">Kritik yönetim işlemlerinin salt-okunur geçmişi.</p></div>
    <form className="mt-6 grid gap-3 rounded-card border border-border-subtle bg-surface-card p-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={applyFilters}>
      <label className="text-sm font-semibold">İşlem<select className="mt-1 min-h-11 w-full rounded-control border border-border-control px-3" onChange={(event)=>setPendingFilters((current)=>({...current,action:event.target.value}))} value={pendingFilters.action}><option value="">Tüm işlemler</option>{Object.entries(actionLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold">Sonuç<select className="mt-1 min-h-11 w-full rounded-control border border-border-control px-3" onChange={(event)=>setPendingFilters((current)=>({...current,result:event.target.value}))} value={pendingFilters.result}><option value="">Tüm sonuçlar</option><option value="success">Başarılı</option><option value="rejected">Reddedildi</option><option value="rate_limited">Sınırlandırıldı</option></select></label>
      <button className="min-h-11 self-end rounded-control bg-brand-navy px-5 font-semibold text-white">Filtrele</button>
    </form>
    {error ? <p className="mt-5 rounded-control bg-error-surface px-4 py-3 text-error" role="alert">{error}</p> : null}
    {loading ? <p className="mt-6 text-text-secondary">Kayıtlar yükleniyor…</p> : null}
    {!loading && data ? <><div className="mt-6 overflow-x-auto rounded-card border border-border-subtle bg-surface-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface-muted text-text-secondary"><tr><th className="p-4">Tarih</th><th className="p-4">Yönetici</th><th className="p-4">İşlem</th><th className="p-4">Varlık</th><th className="p-4">Sonuç</th></tr></thead><tbody className="divide-y divide-border-subtle">{data.records.map((record)=><tr key={record.id}><td className="p-4 whitespace-nowrap"><time dateTime={record.timestamp}>{formatDate(record.timestamp)}</time></td><td className="p-4">{record.adminId ?? "Anonim"}<span className="block text-xs text-text-secondary">{record.role ?? "—"}</span></td><td className="p-4 font-semibold">{actionLabels[record.action] ?? record.action}</td><td className="p-4">{record.entityType || "—"}{record.entityId ? <span className="block text-xs text-text-secondary">{record.entityId}</span> : null}</td><td className="p-4"><span className={`rounded-pill px-3 py-1 text-xs font-semibold ${record.result === "success" ? "bg-success-surface text-success" : "bg-error-surface text-error"}`}>{record.result === "success" ? "Başarılı" : record.result}</span></td></tr>)}{!data.records.length?<tr><td className="p-8 text-center text-text-secondary" colSpan={5}>Bu filtrelerle eşleşen kayıt yok.</td></tr>:null}</tbody></table></div><div className="mt-5 flex items-center justify-between"><button className="min-h-10 rounded-control border border-border-control px-4 disabled:opacity-40" disabled={page===1} onClick={()=>{setLoading(true);setPage((value)=>value-1);}}>Önceki</button><span className="text-sm text-text-secondary">Sayfa {data.page}</span><button className="min-h-10 rounded-control border border-border-control px-4 disabled:opacity-40" disabled={!data.hasNext} onClick={()=>{setLoading(true);setPage((value)=>value+1);}}>Sonraki</button></div></> : null}
  </section>;
}
