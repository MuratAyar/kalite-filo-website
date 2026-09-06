import type { ReactNode } from "react";

export type DashboardRange = "day" | "week" | "month" | "quarter" | "year" | "all";
export type DashboardActivity = { id: string; timestamp: string; adminId: string | null; action: string; entityType: string; entityId: string | null; result: string };
type FormMetrics = { total: number; new: number; inProgress: number; replied: number; closed: number };
export type DashboardData = {
  range: DashboardRange;
  metrics: { activeVehicles: number; totalVehicles: number; draftVehicles: number; featuredVehicles: number; articles: number; draftArticles: number; pendingQuotes: number; pendingContacts: number; pendingContent: number; newsletterContacts: number; approvedMarketingConsents: number; iysPending: number; unsubscribed: number };
  forms: { quote: FormMetrics; contact: FormMetrics };
  recentActivity: DashboardActivity[];
  publishing: { staging: null; production: null };
  failures: unknown[];
  snapshotGeneratedAt: string;
};

const ranges: { value: DashboardRange; label: string }[] = [
  { value: "day", label: "Günlük" }, { value: "week", label: "Haftalık" },
  { value: "month", label: "Aylık" }, { value: "quarter", label: "3 Aylık" },
  { value: "year", label: "1 Senelik" }, { value: "all", label: "Tümü" },
];
const activityLabels: Record<string, string> = {
  login: "Yönetim panelinde oturum açıldı", logout: "Yönetim paneli oturumu kapatıldı",
  failed_login: "Başarısız giriş denemesi kaydedildi", vehicle_create: "Yeni araç oluşturuldu",
  vehicle_update: "Araç bilgileri güncellendi", vehicle_image_create: "Araç galerisine görsel eklendi",
  vehicle_image_update: "Araç galerisi güncellendi", vehicle_image_delete: "Araç galerisinden görsel kaldırıldı",
  article_create: "Yeni blog taslağı oluşturuldu", article_update: "Blog taslağı güncellendi",
  form_submission_status_update: "Form talebinin durumu güncellendi", form_submission_reply: "Form talebi yanıtlandı",
  staging_publish_request: "Staging yayını başlatıldı", staging_publish_deploy: "Staging yayını kuruldu",
  iys_export: "İYS CSV dışa aktarımı oluşturuldu", subscriber_unsubscribe: "Abonelik sonlandırıldı",
};

function Icon({ name, className = "size-5" }: { name: "quote" | "contact" | "car" | "draft" | "pending" | "activity" | "external"; className?: string }) {
  const paths: Record<typeof name, ReactNode> = {
    quote: <><path d="M7 3.5h7l3 3V20H7z"/><path d="M14 3.5V7h3M10 11h4m-4 3h4m-4 3h2"/></>,
    contact: <><path d="M4 5h16v12H8l-4 3z"/><path d="M8 9h8m-8 4h5"/></>,
    car: <><path d="m5 15 1-6h12l1 6"/><path d="M3.5 15h17v4h-2v-2h-13v2h-2zM7 12h.01M17 12h.01"/></>,
    draft: <><path d="M5 4h10l4 4v12H5z"/><path d="M14 4v5h5M9 13h6m-6 3h4"/></>,
    pending: <><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></>,
    activity: <><path d="M3 13h4l2-6 4 11 2-7h6"/></>,
    external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/></>,
  };
  return <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function MetricCard({ label, value, note, icon, tone }: { label: string; value: number; note: ReactNode; icon: Parameters<typeof Icon>[0]["name"]; tone: string }) {
  return <article className="rounded-card border border-border-subtle bg-surface-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3"><p className="max-w-32 text-sm font-semibold text-text-secondary">{label}</p><span className={`grid size-10 shrink-0 place-items-center rounded-control ${tone}`}><Icon name={icon}/></span></div>
    <p className="mt-4 text-3xl font-bold tracking-tight text-brand-navy">{value}</p><div className="mt-2 min-h-10 text-xs text-text-secondary">{note}</div>
  </article>;
}

function FormDistribution({ title, data, icon }: { title: string; data: FormMetrics; icon: "quote" | "contact" }) {
  const states = [
    { key: "new", label: "Yeni", value: data.new, color: "bg-accent-orange", text: "text-orange-dark" },
    { key: "inProgress", label: "İnceleniyor", value: data.inProgress, color: "bg-corporate-blue", text: "text-corporate-blue" },
    { key: "replied", label: "Yanıtlandı", value: data.replied, color: "bg-teal-500", text: "text-teal-700" },
    { key: "closed", label: "Kapandı", value: data.closed, color: "bg-success", text: "text-success" },
  ];
  return <article className="rounded-card border border-border-subtle bg-page p-5">
    <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-control bg-corporate-blue/10 text-corporate-blue"><Icon name={icon}/></span><h4 className="font-bold text-brand-navy">{title}</h4></div><span className="rounded-pill bg-brand-navy px-3 py-1 text-xs font-bold text-white">Toplam: {data.total}</span></div>
    <div aria-label={`${title} durum oranları`} className="mt-4 flex h-2 overflow-hidden rounded-pill bg-border-subtle">{states.map((state) => state.value > 0 ? <span className={state.color} key={state.key} style={{ flexGrow: state.value }} /> : null)}</div>
    <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{states.map((state) => <div className="rounded-control border border-border-subtle bg-white p-3" key={state.key}><dt className="flex items-center gap-2 text-xs text-text-secondary"><span className={`size-2 rounded-full ${state.color}`}/>{state.label}</dt><dd className="mt-2 text-xl font-bold text-brand-navy">{state.value}</dd><p className={`mt-1 text-[0.68rem] font-semibold ${state.text}`}>{state.key === "new" ? "Aksiyon bekliyor" : state.key === "inProgress" ? "İşlem sürüyor" : state.key === "replied" ? "Geri dönüldü" : "Tamamlandı"}</p></div>)}</dl>
  </article>;
}

function relativeDate(value: string) {
  const timestamp = new Date(value).getTime(); if (!Number.isFinite(timestamp)) return "Tarih bilinmiyor";
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Az önce"; if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.round(minutes / 60); if (hours < 24) return `${hours} sa önce`;
  return `${Math.round(hours / 24)} gün önce`;
}

export function AdminDashboard({ data, loading, error, range, environment, onRangeChange, onShowLogs }: { data: DashboardData | null; loading: boolean; error: string; range: DashboardRange; environment: "production" | "staging"; onRangeChange: (range: DashboardRange) => void; onShowLogs: () => void }) {
  return <section className="mt-8">
    <div className="flex flex-col gap-5 border-b border-border-subtle pb-6 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-label font-semibold text-corporate-blue">İçerik ve başvuru merkezi</p><h2 className="mt-1 text-heading-lg text-brand-navy">Genel Bakış</h2><p className="mt-2 text-sm text-text-secondary">Web sitesi içerik, form ve yayın durumunu tek ekrandan takip edin.</p></div><div aria-label="Dashboard tarih aralığı" className="flex flex-wrap rounded-control border border-border-subtle bg-surface-card p-1 shadow-sm">{ranges.map((item) => <button aria-pressed={range === item.value} className={`min-h-9 rounded-control px-3 text-xs font-semibold transition sm:px-4 ${range === item.value ? "bg-brand-navy text-white shadow-sm" : "text-text-secondary hover:bg-surface-muted hover:text-brand-navy"}`} disabled={loading} key={item.value} onClick={() => onRangeChange(item.value)} type="button">{item.label}</button>)}</div></div>
    {error ? <p className="mt-5 rounded-control bg-error-surface px-4 py-3 text-body text-error" role="alert">{error}</p> : null}
    {loading && !data ? <p className="mt-6 text-body text-text-secondary">Metrikler yükleniyor…</p> : null}
    {data ? <>
      <div className={`mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5 ${loading ? "opacity-60" : ""}`}>
        <MetricCard icon="quote" label="Bekleyen Teklif Talepleri" note={<span className="font-semibold text-orange-dark">Seçili dönemde aksiyon bekliyor</span>} tone="bg-orange-100 text-orange-dark" value={data.metrics.pendingQuotes}/>
        <MetricCard icon="contact" label="Bekleyen İletişim Talepleri" note={<span className="font-semibold text-corporate-blue">Yeni ve incelenen talepler</span>} tone="bg-blue-100 text-corporate-blue" value={data.metrics.pendingContacts}/>
        <MetricCard icon="car" label="Yayındaki Araçlar" note={<><strong className="text-success">{data.metrics.totalVehicles ? Math.round(data.metrics.activeVehicles / data.metrics.totalVehicles * 100) : 0}% aktif</strong> · {data.metrics.totalVehicles} araç</>} tone="bg-emerald-100 text-success" value={data.metrics.activeVehicles}/>
        <MetricCard icon="draft" label="Taslak İçerikler" note={<>{data.metrics.draftArticles} rehber · {data.metrics.draftVehicles} araç</>} tone="bg-violet-100 text-violet-700" value={data.metrics.pendingContent}/>
        <MetricCard icon="pending" label="İYS Bekleyen" note={<>{data.metrics.approvedMarketingConsents} onaylı pazarlama izni</>} tone="bg-sky-100 text-sky-700" value={data.metrics.iysPending}/>
      </div>
      <section className="mt-7 rounded-card border border-border-subtle bg-surface-card p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-2 border-b border-border-subtle pb-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><span className="text-corporate-blue"><Icon name="contact"/></span><h3 className="text-xl font-bold text-brand-navy">Teklif ve İletişim Talepleri</h3></div><p className="mt-1 text-sm text-text-secondary">Seçili dönemde gelen formların durum dağılımı</p></div><p className="flex items-center gap-2 text-xs text-text-secondary"><span className="size-2 rounded-full bg-success"/>Gerçek veriler · {environment === "staging" ? "Staging" : "Production"}</p></div><div className="mt-5 grid gap-5 xl:grid-cols-2"><FormDistribution data={data.forms.quote} icon="quote" title="Teklif Talepleri"/><FormDistribution data={data.forms.contact} icon="contact" title="İletişim Talepleri"/></div></section>
      <section className="mt-7 rounded-card border border-border-subtle bg-surface-card p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-5 border-b border-border-subtle pb-4"><div className="flex gap-3"><span className="grid size-10 place-items-center rounded-control bg-corporate-blue/10 text-corporate-blue"><Icon name="activity"/></span><div><h3 className="text-xl font-bold text-brand-navy">Son Aktiviteler</h3><p className="text-sm text-text-secondary">Web sitesi ve CMS üzerindeki güncel işlemler</p></div></div><span className="text-xs text-text-secondary">Seçili dönem</span></div>{data.recentActivity.length ? <ol className="divide-y divide-border-subtle">{data.recentActivity.map((activity) => { const failed = activity.result !== "success"; const icon = activity.entityType.includes("vehicle") ? "car" : activity.entityType.includes("article") ? "draft" : activity.entityType.includes("form") ? "contact" : "activity"; return <li className="flex gap-4 py-4" key={activity.id}><span className={`grid size-10 shrink-0 place-items-center rounded-full border ${failed ? "border-error/30 bg-error-surface text-error" : "border-corporate-blue/20 bg-corporate-blue/5 text-corporate-blue"}`}><Icon name={icon}/></span><div className="min-w-0 flex-1"><p className="font-semibold text-brand-navy">{activityLabels[activity.action] ?? activity.action.replaceAll("_", " ")}</p><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary"><span>{activity.adminId ?? "Sistem"}</span><span>·</span><time dateTime={activity.timestamp}>{relativeDate(activity.timestamp)}</time>{activity.entityType ? <><span>·</span><span className="font-semibold text-corporate-blue">{activity.entityType}</span></> : null}</div></div></li>; })}</ol> : <p className="py-8 text-center text-sm text-text-secondary">Seçili dönemde gösterilecek aktivite bulunmuyor.</p>}<div className="flex flex-col gap-3 border-t border-border-subtle pt-4 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between"><span>Aktiviteler Dashboard açıldığında ve dönem değiştiğinde yenilenir.</span><button className="font-bold text-corporate-blue hover:underline" onClick={onShowLogs} type="button">Tüm Logları Görüntüle</button></div></section>
    </> : null}
  </section>;
}
