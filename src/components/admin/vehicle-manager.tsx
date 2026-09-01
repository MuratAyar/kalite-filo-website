/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { TagGroups, vehicleTagLabels } from "./tag-manager";

type Media = { id: string; alt: string; creator: string; sourcePage: string; licenseName: string; licenseUrl: string };
type Vehicle = Record<string, unknown> & { id: string; make: string; model: string; trim: string; categoryLabel: string; segmentLabel: string; fuelLabel: string; transmissionLabel: string; modelYearLabel: string; slug: string; summary: string; publicationStatus: string; priceAmountMinor?: number | null; coverImage?: { src: string; alt: string } | null; draftMedia?: Media | null };
type VehicleRevision = { id: string; timestamp: string; action: string; actorId: string | null; changedFields: string[]; priceAmountMinor: number | null };
const fieldClass = "mt-1 min-h-11 w-full rounded-control border border-border-control px-3";

function vehicleLoadError(code: unknown) {
  if (code === "vehicle_draft_unreadable") return "Araç taslak dosyası sunucu tarafından okunamıyor. Dosya iznini 600 veya 644 olarak kontrol edin.";
  if (code === "vehicle_draft_invalid_json") return "Araç taslak dosyası geçerli JSON değil. Dosyayı yeniden yükleyin.";
  if (code === "vehicle_draft_invalid_schema") return "Araç taslak dosyasının şeması geçersiz. schemaVersion ve records alanlarını kontrol edin.";
  if (code === "vehicle_draft_too_large") return "Araç taslak dosyası izin verilen boyutu aşıyor.";
  if (code === "taxonomy_store_unreadable") return "Etiket dosyası sunucu tarafından okunamıyor. vehicle-taxonomy.json iznini kontrol edin.";
  if (code === "taxonomy_store_invalid_json" || code === "taxonomy_store_invalid_schema") return "Etiket dosyası bozuk. Private drafts içindeki vehicle-taxonomy.json dosyasını kaldırıp tekrar deneyin.";
  if (code === "taxonomy_store_too_large") return "Etiket dosyası izin verilen boyutu aşıyor.";
  return "Araçlar veya etiketler yüklenemedi.";
}

export function VehicleManager({ csrfToken, publishedOnly }: { csrfToken: string; publishedOnly: boolean }) {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [tags, setTags] = useState<TagGroups>({});
  const [query, setQuery] = useState("");
  const [make, setMake] = useState("");
  const [segment, setSegment] = useState("");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [creating, setCreating] = useState(false);
  const [revisions, setRevisions] = useState<VehicleRevision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  async function load() {
    try {
      const [vehiclesResponse, tagsResponse] = await Promise.all([
        fetch("/admin-api/vehicles.php", { credentials: "same-origin", cache: "no-store" }),
        fetch("/admin-api/tags.php", { credentials: "same-origin", cache: "no-store" }),
      ]);
      const [vehiclesPayload, tagsPayload] = await Promise.all([vehiclesResponse.json(), tagsResponse.json()]);
      if (!vehiclesResponse.ok) throw new Error(vehicleLoadError(vehiclesPayload.error));
      if (!tagsResponse.ok) throw new Error(vehicleLoadError(tagsPayload.error));
      setItems(vehiclesPayload.vehicles ?? []);
      setTags(tagsPayload.groups ?? {});
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Araçlar veya etiketler yüklenemedi."); }
  }

  // Initial network synchronization intentionally populates this client-only admin view.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  const shown = useMemo(() => items.filter((vehicle) => (!publishedOnly || vehicle.publicationStatus === "published") && (!make || vehicle.make === make) && (!segment || vehicle.segmentLabel === segment) && `${vehicle.make} ${vehicle.model} ${vehicle.trim}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))).sort((left, right) => left.make.localeCompare(right.make, "tr", { sensitivity: "base" }) || left.model.localeCompare(right.model, "tr", { sensitivity: "base" }) || left.trim.localeCompare(right.trim, "tr", { sensitivity: "base" })), [items, publishedOnly, make, segment, query]);
  const grouped = useMemo(() => {
    const groups = new Map<string, Vehicle[]>();
    for (const vehicle of shown) groups.set(vehicle.make, [...(groups.get(vehicle.make) ?? []), vehicle]);
    return [...groups.entries()];
  }, [shown]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const json = Object.fromEntries([...form].filter(([key, value]) => typeof value === "string" && !["alt", "creator", "sourcePage", "licenseName", "licenseUrl"].includes(key)));
    const response = await fetch(editing ? `/admin-api/vehicle.php?id=${encodeURIComponent(editing.id)}` : "/admin-api/vehicles.php", { method: editing ? "PATCH" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify(json) });
    if (!response.ok) { setError("Araç kaydedilemedi. Etiket seçimlerini ve zorunlu alanları kontrol edin."); return; }
    const saved = (await response.json()).vehicle as Vehicle;
    const image = form.get("image");
    if (image instanceof File && image.size) {
      form.set("vehicleId", saved.id);
      const mediaResponse = await fetch("/admin-api/media.php", { method: "POST", credentials: "same-origin", headers: { "X-CSRF-Token": csrfToken }, body: form });
      if (!mediaResponse.ok) { setError("Araç kaydedildi ancak görsel yüklenemedi."); await load(); return; }
    }
    setDirty(false); setEditing(null); setCreating(false); await load();
  }

  async function removeImage() {
    if (!editing?.draftMedia || !confirm("Yüklenen taslak görsel silinsin mi?")) return;
    const response = await fetch("/admin-api/media-delete.php", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ vehicleId: editing.id }) });
    if (response.ok) { setEditing({ ...editing, draftMedia: null }); await load(); } else setError("Görsel silinemedi.");
  }

  async function openEditor(vehicle: Vehicle) {
    setDirty(false); setEditing(vehicle); setCreating(false); setRevisions([]); setRevisionsLoading(true);
    try {
      const response = await fetch(`/admin-api/vehicle-revisions.php?id=${encodeURIComponent(vehicle.id)}`, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error("unavailable");
      setRevisions(payload.revisions ?? []);
    } catch { setError("Araç değişiklik geçmişi yüklenemedi."); }
    finally { setRevisionsLoading(false); }
  }

  function priceTry(vehicle: Vehicle) {
    return typeof vehicle.priceAmountMinor === "number" ? String(vehicle.priceAmountMinor / 100) : "";
  }

  const closeEditor = useCallback(() => {
    if (dirty && !window.confirm("Kaydedilmemiş değişiklikleriniz var. Düzenleme ekranını kapatmak istediğinizden emin misiniz?")) return;
    setDirty(false); setEditing(null); setCreating(false);
  }, [dirty]);

  useEffect(() => {
    if (!editing && !creating) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeEditor(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, creating, closeEditor]);

  const formVehicle = editing ?? ({ publicationStatus: "unpublished" } as Vehicle);
  const controlledFields = Object.entries(vehicleTagLabels);
  return <section className="mt-8">
    <div className="flex justify-between gap-4"><h2 className="text-heading-md">{publishedOnly ? "Yayındaki Araçlar" : "Tüm Araçlar"}</h2><button className="rounded-control bg-accent-orange px-5 font-semibold" onClick={() => { setDirty(false); setEditing(null); setCreating(true); }}>Yeni Araç</button></div>
    <div className="mt-6 grid gap-3 rounded-card border bg-white p-4 md:grid-cols-3"><input className={fieldClass} onChange={(event) => setQuery(event.target.value)} placeholder="Marka, model veya donanım ara"/><select className={fieldClass} onChange={(event) => setMake(event.target.value)}><option value="">Tüm markalar</option>{(tags.make ?? []).map((tag) => <option key={tag.id} value={tag.value}>{tag.value}</option>)}</select><select className={fieldClass} onChange={(event) => setSegment(event.target.value)}><option value="">Tüm segmentler</option>{(tags.segmentLabel ?? []).map((tag) => <option key={tag.id} value={tag.value}>{tag.value}</option>)}</select></div>
    {error ? <p className="mt-4 text-error">{error}</p> : null}
    <div className="mt-7 space-y-8">{grouped.map(([brand, vehicles]) => <section key={brand}><div className="mb-4 flex items-center gap-3"><h3 className="text-xl font-bold text-brand-navy">{brand}</h3><span className="rounded-pill bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">{vehicles.length} araç</span><span aria-hidden="true" className="h-px flex-1 bg-border-subtle"/></div><div className="grid gap-5 lg:grid-cols-2">{vehicles.map((vehicle) => { const source = vehicle.draftMedia ? `/admin-api/media-file.php?id=${vehicle.draftMedia.id}` : vehicle.coverImage?.src; return <button aria-label={`${vehicle.make} ${vehicle.model} aracını düzenle`} className="group grid w-full overflow-hidden rounded-card border border-border-subtle bg-surface-card text-left transition hover:border-corporate-blue hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corporate-blue sm:grid-cols-[12rem_1fr]" key={vehicle.id} onClick={() => void openEditor(vehicle)} type="button"><div className="aspect-video bg-surface-muted sm:aspect-auto">{source ? <img className="size-full object-cover" src={source} alt={vehicle.draftMedia?.alt ?? vehicle.coverImage?.alt ?? ""}/> : <span className="grid size-full min-h-36 place-items-center text-sm text-text-secondary">Araç görseli yok</span>}</div><div className="p-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-pill bg-surface-muted px-3 py-1 text-xs font-semibold">{vehicle.categoryLabel}</span><span className={`rounded-pill px-3 py-1 text-xs font-semibold ${vehicle.publicationStatus === "published" ? "bg-success-surface text-success" : "bg-surface-muted text-text-secondary"}`}>{vehicle.publicationStatus === "published" ? "Yayında" : "Yayında değil"}</span></div><h4 className="mt-3 text-lg font-bold text-brand-navy">{vehicle.model}</h4><p className="mt-1 line-clamp-2 text-sm text-text-secondary">{vehicle.trim}</p><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary"><span>{vehicle.segmentLabel}</span><span>{vehicle.fuelLabel}</span><span>{vehicle.transmissionLabel}</span><span>{vehicle.modelYearLabel}</span></div><div className="mt-4 flex items-end justify-between gap-4"><p className="font-semibold text-brand-navy">{vehicle.priceAmountMinor ? `${new Intl.NumberFormat("tr-TR").format(vehicle.priceAmountMinor / 100)} TL + KDV / ay` : "Fiyat girilmemiş"}</p><span className="shrink-0 rounded-control border border-corporate-blue px-3 py-2 text-xs font-semibold text-corporate-blue group-hover:bg-corporate-blue group-hover:text-white">Düzenle</span></div></div></button>; })}</div></section>)}</div>
    {!shown.length ? <p className="mt-6 rounded-card border border-border-subtle bg-surface-card p-6 text-text-secondary">Bu filtrelere uygun araç bulunamadı.</p> : null}
    {(editing || creating) ? <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy/75 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}><form className="mx-auto my-5 max-w-6xl rounded-card bg-page p-5 sm:p-7" onInput={() => setDirty(true)} onSubmit={save}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-corporate-blue">Araç yönetimi</p><h3 className="mt-1 text-heading-md">{editing ? "Aracı Düzenle" : "Yeni Araç"}</h3></div><button className="rounded-control border border-border-control px-4 py-2 font-semibold" type="button" onClick={closeEditor}>Kapat</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">
      {controlledFields.map(([name, label]) => <label className="text-sm font-semibold" key={name}>{label} *<select className={fieldClass} defaultValue={String(formVehicle[name] ?? "")} name={name} required><option value="">Seçin</option>{(tags[name] ?? []).map((tag) => <option key={tag.id} value={tag.value}>{tag.value}</option>)}</select></label>)}
      {[['trim', 'Donanım', true], ['modelYearLabel', 'Model yılı', true], ['transmissionLabel', 'Şanzıman', true], ['slug', 'Slug', true], ['powerHp', 'Motor gücü', false], ['seats', 'Koltuk sayısı', false]].map(([name, label, required]) => <label className="text-sm font-semibold" key={String(name)}>{label}{required ? " *" : ""}<input className={fieldClass} defaultValue={String(formVehicle[String(name)] ?? "")} name={String(name)} required={Boolean(required)}/></label>)}
      <label className="text-sm font-semibold">Aylık liste-net fiyatı (TL)<input className={fieldClass} defaultValue={priceTry(formVehicle)} inputMode="numeric" min="1" name="priceAmountTry" placeholder="40200" step="1" type="number"/></label>
      <label>Yayın durumu<select className={fieldClass} defaultValue={formVehicle.publicationStatus} name="publicationStatus"><option value="unpublished">Yayında değil</option><option value="published">Yayında</option></select></label><label className="sm:col-span-2">Özet *<textarea className={fieldClass} defaultValue={formVehicle.summary} name="summary" required/></label>
      <fieldset className="sm:col-span-2 grid gap-3 rounded-card border p-4 sm:grid-cols-2"><legend>Kapak görseli</legend><input accept="image/jpeg,image/png,image/webp" className="sm:col-span-2" name="image" type="file"/>{[['alt', 'Alternatif metin'], ['creator', 'Oluşturan'], ['sourcePage', 'Kaynak sayfası URL'], ['licenseName', 'Lisans adı'], ['licenseUrl', 'Lisans URL']].map(([name, label]) => <label key={name}>{label}<input className={fieldClass} defaultValue={String(formVehicle.draftMedia?.[name as keyof Media] ?? "")} name={name}/></label>)}{editing?.draftMedia ? <div className="sm:col-span-2 flex gap-3"><a className="border p-2" href={`/admin-api/media-file.php?id=${editing.draftMedia.id}&download=1`}>İndir</a><button className="border border-error p-2 text-error" onClick={removeImage} type="button">Sil</button></div> : null}</fieldset>
      {editing ? <section className="sm:col-span-2 rounded-card bg-surface-muted p-4"><h4 className="font-bold">Değişiklik geçmişi</h4>{revisionsLoading ? <p className="mt-2 text-sm">Yükleniyor…</p> : revisions.length ? <ol className="mt-3 space-y-3">{revisions.map((revision) => <li className="rounded-control bg-white p-3 text-sm" key={revision.id}><div className="flex flex-wrap justify-between gap-2"><strong>{revision.action === "create" ? "Araç oluşturuldu" : "Araç güncellendi"}</strong><time dateTime={revision.timestamp}>{new Date(revision.timestamp).toLocaleString("tr-TR")}</time></div><p className="mt-1 text-text-secondary">Değişen alanlar: {revision.changedFields.join(", ") || "—"}</p>{revision.priceAmountMinor !== null ? <p className="mt-1">Fiyat: {new Intl.NumberFormat("tr-TR").format(revision.priceAmountMinor / 100)} TL + KDV / ay</p> : null}</li>)}</ol> : <p className="mt-2 text-sm text-text-secondary">Henüz kayıtlı bir değişiklik yok.</p>}</section> : null}
    </div><button className="mt-6 min-h-12 w-full rounded-control bg-accent-orange font-bold">Kaydet</button></form></div> : null}
  </section>;
}
