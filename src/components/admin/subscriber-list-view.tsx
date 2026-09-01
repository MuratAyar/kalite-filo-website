"use client";
import { FormEvent, useEffect, useState } from "react";
type Contact = {
  id: string;
  email: string;
  status: string;
  consent_source: string;
  consent_text_version: string;
  consent_at: string;
  confirmed_at: string;
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
function dateInput(value: string) {
  return value ? value.replace(" ", "T").slice(0, 16) : "";
}
export function SubscriberListView({
  csrfToken,
  canManage,
  canCorrect,
}: {
  csrfToken: string;
  canManage: boolean;
  canCorrect: boolean;
}) {
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
  const [editing, setEditing] = useState<Contact | null>(null);
  const [editError, setEditError] = useState("");
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (iysStatus) params.set("iysStatus", iysStatus);
    if (source) params.set("source", source);
    if (sort) { params.set("sort", sort.field); params.set("direction", sort.direction); }
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
  }, [page, query, status, iysStatus, source, sort, refresh]);
  function filter(setter: (value: string) => void, value: string) {
    setLoading(true);
    setPage(1);
    setter(value);
  }
  function cycleSort(field: string) {
    setLoading(true); setPage(1);
    setSort((current) => current?.field !== field ? { field, direction: "desc" } : current.direction === "desc" ? { field, direction: "asc" } : null);
  }
  async function unsubscribe(record: Contact) {
    if (
      !window.confirm(
        `${record.email} adresi gelecekteki pazarlama gönderimlerinden çıkarılsın mı? Consent kanıtı korunacaktır.`,
      )
    )
      return;
    setLoading(true);
    try {
      const response = await fetch("/admin-api/subscriber-operation.php", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ operation: "unsubscribe", email: record.email }),
      });
      if (!response.ok) throw new Error();
      setRefresh((value) => value + 1);
      setError("");
    } catch {
      setError("Abonelikten çıkarma işlemi tamamlanamadı.");
      setLoading(false);
    }
  }
  async function correctRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries()) as Record<string, string>;
    if (body.status !== "unsubscribed") body.unsubscribedAt = "";
    const reason = body.reason?.trim() ?? "";
    if (reason.length < 10) { setEditError("Düzeltme gerekçesi en az 10 karakter olmalıdır."); return; }
    if (body.status === "unsubscribed" && !body.unsubscribedAt) { setEditError("Unsubscribed durumunda abonelikten çıkış tarihi zorunludur."); return; }
    if (["pending", "failed", "approved", "synced"].includes(body.iysStatus) && (body.status !== "approved" || !body.consentTextVersion?.trim() || !body.consentAt)) { setEditError("Seçilen İYS durumu için Durum approved olmalı; consent versiyonu ve consent tarihi girilmelidir."); return; }
    setEditError("");
    if (
      !window.confirm(`${editing.email} kaydındaki düzeltmeler kaydedilsin mi?`)
    )
      return;
    setLoading(true);
    try {
      const response = await fetch("/admin-api/subscriber-operation.php", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          operation: "correct_record",
          id: editing.id,
          ...body,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(String(payload.error ?? "validation_failed"));
      setEditing(null);
      setRefresh((value) => value + 1);
      setError("");
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "validation_failed";
      const messages: Record<string,string> = { correction_reason_required: "Düzeltme gerekçesi en az 10 karakter olmalıdır.", invalid_contact_date: "Tarih alanlarından biri geçerli değil.", unsubscribe_date_required: "Unsubscribed durumunda abonelikten çıkış tarihi zorunludur.", unsubscribe_date_must_be_empty: "Aboneliğe geri alınan kaydın çıkış tarihi boş olmalıdır.", iys_requires_consent: "Seçilen İYS durumu için approved durum ve geçerli consent kanıtı gereklidir.", invalid_consent_version: "Consent metin versiyonu geçerli değil.", not_found: "Düzenlenen kayıt artık bulunamıyor." };
      setEditError(messages[code] ?? "Kayıt güncellenemedi. Alanları kontrol edip tekrar deneyin.");
      setLoading(false);
    }
  }
  return (
    <section className="mt-8">
      <p className="text-label font-semibold text-corporate-blue">
        İzin ve kişi görünümü
      </p>
      <h2 className="mt-1 text-heading-md">Newsletter Kişileri</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Teklif/iletişim kaydı pazarlama izni değildir. Owner/Admin düzeltmeleri
        gerekçe ve denetim kaydıyla uygulanır.
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
                ["E-posta", ""], ["Durum", ""], ["Kaynak", ""],
                ["Consent kanıtı", "consentAt"], ["İYS", "iysSyncedAt"],
                ["Alıcı", ""], ["Abonelikten çıkış", "unsubscribedAt"],
                ["Oluşturma", "createdAt"], ["Güncelleme", "updatedAt"], ["İşlem", ""],
              ].map(([label, field]) => (
                <th className="px-4 py-3" key={label}>
                  {field ? <button className="inline-flex items-center gap-1 font-semibold hover:text-corporate-blue" onClick={() => cycleSort(field)} type="button">{label}<span aria-hidden="true">{sort?.field === field ? sort.direction === "desc" ? "↓" : "↑" : "↕"}</span></button> : label}
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
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    {canCorrect ? (
                      <button
                        className="rounded-control border border-corporate-blue px-3 py-2 text-xs font-semibold text-corporate-blue"
                        disabled={loading}
                        onClick={() => { setEditError(""); setEditing(record); }}
                      >
                        Düzenle
                      </button>
                    ) : null}
                    {canManage && record.status !== "unsubscribed" ? (
                      <button
                        className="rounded-control border border-error px-3 py-2 text-xs font-semibold text-error"
                        disabled={loading}
                        onClick={() => void unsubscribe(record)}
                      >
                        Abonelikten Çıkar
                      </button>
                    ) : null}
                    {!canManage ? "—" : null}
                  </div>
                </td>
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
      {editing ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <form
            className="mx-auto my-8 max-w-3xl rounded-card bg-page p-6"
            onSubmit={correctRecord}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-corporate-blue">
                  Kontrollü idari düzeltme
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  Bülten Kişisini Düzenle
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {editing.email}
                </p>
              </div>
              <button
                className="rounded-control border px-3 py-2"
                onClick={() => setEditing(null)}
                type="button"
              >
                Kapat
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Durum
                <select
                  className={`${control} mt-1 w-full`}
                  defaultValue={editing.status}
                  name="status"
                  onChange={(event) => {
                    setEditError("");
                    if (event.target.value !== "unsubscribed") {
                      const field = event.currentTarget.form?.elements.namedItem("unsubscribedAt");
                      if (field instanceof HTMLInputElement) field.value = "";
                    }
                  }}
                >
                  {["approved", "active", "lead_only", "unsubscribed"].map(
                    (value) => (
                      <option key={value}>{value}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Kaynak
                <select
                  className={`${control} mt-1 w-full`}
                  defaultValue={editing.consent_source}
                  name="consentSource"
                >
                  {Object.entries(sources).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Consent metin versiyonu
                <input
                  className={`${control} mt-1 w-full`}
                  defaultValue={editing.consent_text_version}
                  maxLength={160}
                  name="consentTextVersion"
                />
              </label>
              <label className="text-sm font-semibold">
                Consent tarihi
                <input
                  className={`${control} mt-1 w-full`}
                  defaultValue={dateInput(editing.consent_at)}
                  name="consentAt"
                  type="datetime-local"
                />
              </label>
              <label className="text-sm font-semibold">
                Onay tarihi
                <input
                  className={`${control} mt-1 w-full`}
                  defaultValue={dateInput(editing.confirmed_at)}
                  name="confirmedAt"
                  type="datetime-local"
                />
              </label>
              <label className="text-sm font-semibold">
                Abonelikten çıkış
                <input
                  className={`${control} mt-1 w-full`}
                  defaultValue={dateInput(editing.unsubscribed_at)}
                  name="unsubscribedAt"
                  type="datetime-local"
                />
              </label>
              <label className="text-sm font-semibold">
                İYS
                <select
                  className={`${control} mt-1 w-full`}
                  defaultValue={editing.iys_status}
                  name="iysStatus"
                >
                  {[
                    "not_requested",
                    "pending",
                    "failed",
                    "approved",
                    "synced",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Alıcı
                <select
                  className={`${control} mt-1 w-full`}
                  defaultValue={editing.recipient_type}
                  name="recipientType"
                >
                  <option value="BIREYSEL">BIREYSEL</option>
                  <option value="TACIR">TACIR</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                Oluşturma
                <input
                  className={`${control} mt-1 w-full bg-surface-muted`}
                  disabled
                  value={editing.created_at}
                />
              </label>
              <label className="text-sm font-semibold">
                Son güncelleme
                <input
                  className={`${control} mt-1 w-full bg-surface-muted`}
                  disabled
                  value={editing.updated_at}
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Düzeltme gerekçesi *
                <textarea
                  className="mt-1 min-h-24 w-full rounded-control border border-border-control bg-white p-3"
                  maxLength={500}
                  minLength={10}
                  name="reason"
                  required
                />
              </label>
            </div>
            {editError ? <p className="mt-5 rounded-control bg-error-surface px-4 py-3 text-sm font-semibold text-error" role="alert">{editError}</p> : null}
            <button
              className="mt-6 min-h-11 w-full rounded-control bg-accent-orange font-bold"
              disabled={loading}
            >
              Değişiklikleri Kaydet
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
