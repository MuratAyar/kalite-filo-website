"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type FormKind = "quote" | "contact";
type FormStatus = "new" | "in_progress" | "replied" | "closed";
type Submission = {
  id: string;
  kind: FormKind;
  formType: "individual" | "corporate" | "cart" | "contact";
  referenceNumber: string | null;
  status: FormStatus;
  name: string;
  email: string;
  phone: string;
  details: Record<string, unknown>;
  createdAt: string;
  replyHistory: Array<{ id: string; sentAt: string; subject: string; message: string }>;
};

const statusLabels: Record<FormStatus, string> = {
  new: "Yeni",
  in_progress: "İnceleniyor",
  replied: "Yanıtlandı",
  closed: "Kapandı",
};
const typeLabels: Record<Submission["formType"], string> = {
  individual: "Bireysel",
  corporate: "Kurumsal",
  cart: "Sepet",
  contact: "İletişim",
};
const detailLabels: Record<string, string> = {
  title: "Unvan", city: "İl", district: "İlçe", companyWebsite: "Web sitesi",
  companyType: "Şirket tipi", companyTitle: "Şirket unvanı", taxCity: "Vergi ili",
  taxOffice: "Vergi dairesi", vehicleMake: "Marka", vehicleModel: "Model",
  vehicleCount: "Araç sayısı", durationMonths: "Süre", annualKilometres: "Yıllık km",
  note: "Not", campaignCode: "Kampanya kodu", message: "Mesaj",
};

function parseSubmission(value: unknown): Submission | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || (item.kind !== "quote" && item.kind !== "contact") ||
      !["individual", "corporate", "cart", "contact"].includes(String(item.formType)) ||
      !["new", "in_progress", "replied", "closed"].includes(String(item.status)) ||
      typeof item.name !== "string" || typeof item.email !== "string" || typeof item.createdAt !== "string") return null;
  return {
    id: item.id, kind: item.kind, formType: item.formType as Submission["formType"],
    referenceNumber: typeof item.referenceNumber === "string" ? item.referenceNumber : null,
    status: item.status as FormStatus, name: item.name, email: item.email,
    phone: typeof item.phone === "string" ? item.phone : "",
    details: item.details && typeof item.details === "object" && !Array.isArray(item.details) ? item.details as Record<string, unknown> : {},
    createdAt: item.createdAt,
    replyHistory: Array.isArray(item.replyHistory) ? item.replyHistory.filter((reply): reply is Submission["replyHistory"][number] => {
      if (!reply || typeof reply !== "object") return false;
      const record = reply as Record<string, unknown>;
      return [record.id, record.sentAt, record.subject, record.message].every((field) => typeof field === "string");
    }) : [],
  };
}

function displayValue(key: string, value: unknown): string | null {
  if (key === "cartItems" || value === "" || value === null || value === undefined) return null;
  if (key === "durationMonths" && typeof value === "number") return `${value} ay`;
  if (key === "annualKilometres" && typeof value === "number") return `${new Intl.NumberFormat("tr-TR").format(value)} km`;
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  return null;
}

function truncateMessage(value: string, maximum = 220): string {
  const normalized = value.trim();
  return normalized.length > maximum ? `${normalized.slice(0, maximum).trimEnd()} (...)` : normalized;
}

export function FormSubmissionsView({ kind, csrfToken }: { kind: FormKind; csrfToken: string }) {
  const [records, setRecords] = useState<Submission[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [replyId, setReplyId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const parameters = new URLSearchParams({ kind });
    if (type) parameters.set("type", type);
    if (status) parameters.set("status", status);
    if (query.trim()) parameters.set("q", query.trim());
    try {
      const response = await fetch(`/admin-api/form-submissions.php?${parameters}`, { cache: "no-store", credentials: "same-origin" });
      const payload: unknown = await response.json().catch(() => ({}));
      const raw = payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>).submissions) ? (payload as { submissions: unknown[] }).submissions : [];
      if (!response.ok) throw new Error("load_failed");
      setRecords(raw.map(parseSubmission).filter((item): item is Submission => item !== null));
    } catch { setError("Form kayıtları şu anda yüklenemiyor."); }
    finally { setLoading(false); }
  }, [kind, query, status, type]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);

  async function changeStatus(id: string, nextStatus: FormStatus) {
    setBusyId(id); setError("");
    try {
      const response = await fetch("/admin-api/form-submission.php", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ id, status: nextStatus }) });
      if (!response.ok) throw new Error("update_failed");
      setRecords((current) => current.map((record) => record.id === id ? { ...record, status: nextStatus } : record));
      setNotice("Form durumu güncellendi.");
    } catch { setError("Form durumu güncellenemedi."); }
    finally { setBusyId(""); }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); setBusyId(id); setError(""); setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/admin-api/form-submission-reply.php", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ id, subject: data.get("subject"), message: data.get("message") }) });
      if (!response.ok) throw new Error("reply_failed");
      setReplyId(""); setNotice("Yanıt kullanıcıya gönderildi ve form yanıtlandı olarak işaretlendi.");
      await load();
    } catch { setError("Yanıt gönderilemedi. SMTP ayarlarını ve servis günlüklerini kontrol edin."); }
    finally { setBusyId(""); }
  }

  return <section className="mt-8">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-label font-semibold text-corporate-blue">Form yönetimi</p><h2 className="mt-1 text-heading-md">{kind === "quote" ? "Teklif Formu" : "İletişim Formu"}</h2></div><p className="text-sm text-text-secondary">{records.length} kayıt</p></div>
    <div className="mt-6 grid gap-3 rounded-card border border-border-subtle bg-surface-card p-4 md:grid-cols-3">
      <label className="text-sm font-semibold">Ara<input className="mt-2 min-h-11 w-full rounded-control border border-border-control px-3 font-normal" onChange={(event) => setQuery(event.target.value)} placeholder="Ad, e-posta, telefon, referans" /></label>
      {kind === "quote" ? <label className="text-sm font-semibold">Form türü<select className="mt-2 min-h-11 w-full rounded-control border border-border-control px-3 font-normal" onChange={(event) => setType(event.target.value)}><option value="">Tümü</option><option value="individual">Bireysel</option><option value="corporate">Kurumsal</option><option value="cart">Sepet</option></select></label> : <div />}
      <label className="text-sm font-semibold">Durum<select className="mt-2 min-h-11 w-full rounded-control border border-border-control px-3 font-normal" onChange={(event) => setStatus(event.target.value)}><option value="">Tümü</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {error ? <p className="mt-4 rounded-control bg-error-surface p-4 text-error" role="alert">{error}</p> : null}{notice ? <p className="mt-4 rounded-control bg-success-surface p-4 text-success" role="status">{notice}</p> : null}
    {loading ? <p className="mt-6 text-text-secondary">Formlar yükleniyor…</p> : records.length === 0 ? <p className="mt-6 rounded-card border border-dashed border-border-control p-8 text-center text-text-secondary">Bu filtrelerle eşleşen form bulunamadı.</p> : <div className="mt-6 space-y-4">{records.map((record) => {
      const cart = Array.isArray(record.details.cartItems) ? record.details.cartItems : [];
      const expanded = expandedId === record.id;
      const initialMessage = typeof record.details.message === "string" ? record.details.message : typeof record.details.note === "string" ? record.details.note : "";
      return <article className={`cursor-pointer overflow-hidden rounded-card border bg-surface-card shadow-sm transition ${expanded ? "border-corporate-blue shadow-md" : "border-border-subtle"}`} key={record.id} onClick={(event) => { if (!(event.target as HTMLElement).closest("button,a,input,select,textarea,label,form")) setExpandedId((current) => current === record.id ? "" : record.id); }}>
        <div className="grid gap-5 border-l-4 border-accent-orange p-5 lg:grid-cols-[minmax(210px,0.8fr)_minmax(300px,1.6fr)_minmax(220px,0.8fr)]">
          <div><div className="flex flex-wrap gap-2"><span className="rounded-pill bg-brand-navy px-3 py-1 text-xs font-bold text-white">{typeLabels[record.formType]}</span><span className="rounded-pill bg-orange-light px-3 py-1 text-xs font-bold text-brand-navy">{statusLabels[record.status]}</span></div><h3 className="mt-4 text-lg font-bold">{record.name}</h3><p className="mt-1 text-sm text-text-secondary">{record.referenceNumber ?? record.id}</p><p className="mt-3 text-sm"><a className="text-corporate-blue underline" href={`mailto:${record.email}`}>{record.email}</a>{record.phone ? <><br /><a href={`tel:${record.phone.replace(/\s/g, "")}`}>{record.phone}</a></> : null}</p><time className="mt-3 block text-xs text-text-secondary">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.createdAt))}</time></div>
          <dl className="grid content-start gap-x-5 gap-y-3 sm:grid-cols-2">{Object.entries(record.details).map(([key, value]) => { const shown = displayValue(key, value); return shown ? <div className={key === "message" || key === "note" ? "sm:col-span-2" : ""} key={key}><dt className="text-xs font-bold uppercase tracking-wide text-text-secondary">{detailLabels[key] ?? key}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{key === "message" || key === "note" ? truncateMessage(shown) : shown}</dd></div> : null; })}{cart.slice(0, expanded ? cart.length : 2).map((item, index) => <div className="rounded-control bg-page p-3 text-sm sm:col-span-2" key={index}><dt className="font-bold">Sepet aracı {index + 1}</dt><dd className="mt-1 whitespace-pre-wrap font-sans text-text-secondary">{item && typeof item === "object" ? Object.values(item).join(" · ") : String(item)}</dd></div>)}</dl>
          <div><label className="text-xs font-bold uppercase tracking-wide text-text-secondary">Durum<select className="mt-2 min-h-11 w-full rounded-control border border-border-control px-3 text-sm font-normal" disabled={busyId === record.id} onChange={(event) => void changeStatus(record.id, event.target.value as FormStatus)} value={record.status}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="mt-4 min-h-11 w-full rounded-control bg-accent-orange px-4 font-bold text-on-accent disabled:opacity-50" disabled={busyId === record.id} onClick={() => { setExpandedId(record.id); setReplyId((current) => current === record.id ? "" : record.id); }} type="button">{replyId === record.id ? "Yanıtı Kapat" : "Yanıt Oluştur"}</button><button aria-expanded={expanded} className="mt-2 min-h-10 w-full rounded-control border border-border-control px-3 text-sm font-semibold text-corporate-blue" onClick={() => setExpandedId((current) => current === record.id ? "" : record.id)} type="button">{expanded ? "Detayları Gizle" : "Kartı Genişlet"}</button><p className="mt-3 text-xs text-text-secondary">{record.replyHistory.length ? `${record.replyHistory.length} yanıt gönderildi` : "Henüz yanıt gönderilmedi"}</p></div>
        </div>
        {expanded ? <section className="border-t border-border-subtle bg-page p-5" aria-label="Mesaj geçmişi"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-corporate-blue">Konuşma Geçmişi</p><h4 className="mt-1 text-lg font-bold">Kullanıcı ve admin mesajları</h4></div><span className="rounded-pill bg-surface-card px-3 py-1 text-xs font-semibold">{record.replyHistory.length + 1} ileti</span></div><ol className="mt-5 space-y-4"><li className="mr-auto max-w-3xl rounded-card border border-border-subtle bg-surface-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{record.name}</strong><time className="text-xs text-text-secondary">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.createdAt))}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{initialMessage || "Kullanıcı ayrıca bir mesaj iletmedi."}</p></li>{record.replyHistory.map((reply) => <li className="ml-auto max-w-3xl rounded-card border border-corporate-blue/20 bg-corporate-blue/5 p-4" key={reply.id}><div className="flex flex-wrap items-center justify-between gap-2"><div><strong>Kalite Filo Admin</strong><p className="mt-0.5 text-xs font-semibold text-corporate-blue">{reply.subject}</p></div><time className="text-xs text-text-secondary">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reply.sentAt))}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{reply.message}</p></li>)}</ol></section> : null}
        {replyId === record.id ? <form className="grid gap-4 border-t border-border-subtle bg-page p-5" onSubmit={(event) => void sendReply(event, record.id)}><label className="text-sm font-semibold">Konu<input className="mt-2 min-h-11 w-full rounded-control border border-border-control px-3 font-normal" defaultValue={`${record.referenceNumber ? `${record.referenceNumber} - ` : ""}Talebiniz hakkında`} maxLength={180} name="subject" required /></label><label className="text-sm font-semibold">Mesaj<textarea className="mt-2 min-h-36 w-full rounded-control border border-border-control p-3 font-normal" maxLength={5000} name="message" required /></label><div className="flex justify-end"><button className="min-h-11 rounded-control bg-brand-navy px-6 font-bold text-white disabled:opacity-50" disabled={busyId === record.id}>Yanıtı Gönder</button></div></form> : null}
      </article>;
    })}</div>}
  </section>;
}
