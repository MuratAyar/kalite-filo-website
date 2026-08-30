"use client";
import { useEffect, useState } from "react";
type Contact = {
  id: string;
  email: string;
  status: string;
  consent_source: string;
  consent_text_version: string;
  consent_at: string;
  unsubscribed_at: string;
  created_at: string;
  updated_at: string;
  iys_status: string;
  iys_synced_at: string;
  recipient_type: string;
};
const control =
  "min-h-11 rounded-control border border-border-control bg-white px-3";
const sources: Record<string, string> = {
  website_newsletter: "Newsletter",
  website_quote_form: "Teklif formu",
  website_contact_form: "İletişim formu",
};
export function SubscriberListView({csrfToken,canManage}:{csrfToken:string;canManage:boolean}) {
  const [records, setRecords] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [iysStatus, setIysStatus] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (iysStatus) params.set("iysStatus", iysStatus);
    if (source) params.set("source", source);
    void fetch(`/admin-api/subscribers.php?${params}`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !Array.isArray(payload.records)) throw new Error();
        setRecords(payload.records);
        setTotal(Number(payload.total) || 0);
        setHasNext(payload.hasNext === true);
        setError("");
      })
      .catch((cause) => {
        if (cause instanceof Error && cause.name !== "AbortError")
          setError("Newsletter kişileri yüklenemedi.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [page, query, status, iysStatus, source, refresh]);
  function filter(setter: (value: string) => void, value: string) {
    setLoading(true);
    setPage(1);
    setter(value);
  }
  async function unsubscribe(record:Contact){if(!window.confirm(`${record.email} adresi gelecekteki pazarlama gönderimlerinden çıkarılsın mı? Consent kanıtı korunacaktır.`))return;setLoading(true);try{const response=await fetch("/admin-api/subscriber-operation.php",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-CSRF-Token":csrfToken},body:JSON.stringify({operation:"unsubscribe",email:record.email})});if(!response.ok)throw new Error();setRefresh(value=>value+1);setError("");}catch{setError("Abonelikten çıkarma işlemi tamamlanamadı.");setLoading(false)}}
  return (
    <section className="mt-8">
      <p className="text-label font-semibold text-corporate-blue">
        İzin ve kişi görünümü
      </p>
      <h2 className="mt-1 text-heading-md">Newsletter Kişileri</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Salt okunur · Teklif/iletişim kaydı pazarlama izni değildir. Consent
        evidence bu ekrandan değiştirilemez.
      </p>
      <div className="mt-6 grid gap-3 rounded-card border bg-surface-card p-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          className={control}
          onChange={(e) => filter(setQuery, e.target.value)}
          placeholder="E-posta ara"
        />
        <select
          className={control}
          onChange={(e) => filter(setStatus, e.target.value)}
        >
          <option value="">Tüm durumlar</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="lead_only">Lead only</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <select
          className={control}
          onChange={(e) => filter(setIysStatus, e.target.value)}
        >
          <option value="">Tüm İYS durumları</option>
          {["not_requested", "pending", "approved", "failed", "synced"].map(
            (value) => (
              <option key={value}>{value}</option>
            ),
          )}
        </select>
        <select
          className={control}
          onChange={(e) => filter(setSource, e.target.value)}
        >
          <option value="">Tüm kaynaklar</option>
          {Object.entries(sources).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p
          className="mt-5 rounded-control bg-error-surface p-4 text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 overflow-x-auto rounded-card border bg-surface-card">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-surface-muted text-text-secondary">
            <tr>
              {[
                "E-posta",
                "Durum",
                "Kaynak",
                "Consent kanıtı",
                "İYS",
                "Alıcı",
                "Abonelikten çıkış",
                "Oluşturma",
                "Güncelleme",
                "İşlem",
              ].map((label) => (
                <th className="px-4 py-3" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((record) => (
              <tr key={`${record.id}-${record.consent_source}`}>
                <td className="px-4 py-4 font-semibold">{record.email}</td>
                <td className="px-4 py-4">{record.status}</td>
                <td className="px-4 py-4">
                  {sources[record.consent_source] ?? record.consent_source}
                </td>
                <td className="px-4 py-4">
                  <span className="block">
                    {record.consent_text_version || "—"}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {record.consent_at || "Consent yok"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="block">{record.iys_status}</span>
                  <span className="text-xs text-text-secondary">
                    {record.iys_synced_at || "Senkron yok"}
                  </span>
                </td>
                <td className="px-4 py-4">{record.recipient_type}</td>
                <td className="px-4 py-4">{record.unsubscribed_at || "—"}</td>
                <td className="px-4 py-4">{record.created_at}</td>
                <td className="px-4 py-4">{record.updated_at}</td>
                <td className="px-4 py-4">{canManage&&record.status!=="unsubscribed"?<button className="rounded-control border border-error px-3 py-2 text-xs font-semibold text-error" disabled={loading} onClick={()=>void unsubscribe(record)}>Abonelikten Çıkar</button>:"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? (
          <p className="p-6 text-text-secondary">Kayıtlar yükleniyor…</p>
        ) : !records.length ? (
          <p className="p-6 text-text-secondary">
            Bu filtrelere uygun kayıt yok.
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Toplam {total} kayıt · Sayfa {page}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-control border px-4 py-2 disabled:opacity-40"
            disabled={page === 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage((v) => v - 1);
            }}
          >
            Önceki
          </button>
          <button
            className="rounded-control border px-4 py-2 disabled:opacity-40"
            disabled={!hasNext || loading}
            onClick={() => {
              setLoading(true);
              setPage((v) => v + 1);
            }}
          >
            Sonraki
          </button>
        </div>
      </div>
    </section>
  );
}
