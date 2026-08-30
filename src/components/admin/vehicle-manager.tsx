/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { TagGroups, vehicleTagLabels } from "./tag-manager";

type Media = { id: string; alt: string; creator: string; sourcePage: string; licenseName: string; licenseUrl: string };
type Vehicle = Record<string, unknown> & { id: string; make: string; model: string; trim: string; categoryLabel: string; segmentLabel: string; fuelLabel: string; transmissionLabel: string; modelYearLabel: string; slug: string; summary: string; publicationStatus: string; priceAmountMinor?: number | null; coverImage?: { src: string; alt: string } | null; draftMedia?: Media | null };
type VehicleRevision = { id: string; timestamp: string; action: string; actorId: string | null; changedFields: string[]; priceAmountMinor: number | null };
const fieldClass = "mt-1 min-h-11 w-full rounded-control border border-border-control px-3";

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

  async function load() {
    try {
      const [vehiclesResponse, tagsResponse] = await Promise.all([
        fetch("/admin-api/vehicles.php", { credentials: "same-origin", cache: "no-store" }),
        fetch("/admin-api/tags.php", { credentials: "same-origin", cache: "no-store" }),
      ]);
      const [vehiclesPayload, tagsPayload] = await Promise.all([vehiclesResponse.json(), tagsResponse.json()]);
      if (!vehiclesResponse.ok || !tagsResponse.ok) throw new Error("unavailable");
      setItems(vehiclesPayload.vehicles ?? []);
      setTags(tagsPayload.groups ?? {});
    } catch { setError("Araçlar veya etiketler yüklenemedi."); }
  }

  // Initial network synchronization intentionally populates this client-only admin view.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  const shown = useMemo(() => items.filter((vehicle) => (!publishedOnly || vehicle.publicationStatus === "published") && (!make || vehicle.make === make) && (!segment || vehicle.segmentLabel === segment) && `${vehicle.make} ${vehicle.model} ${vehicle.trim}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))), [items, publishedOnly, make, segment, query]);

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
    setEditing(null); setCreating(false); await load();
  }

  async function removeImage() {
    if (!editing?.draftMedia || !confirm("Yüklenen taslak görsel silinsin mi?")) return;
    const response = await fetch("/admin-api/media-delete.php", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ vehicleId: editing.id }) });
    if (response.ok) { setEditing({ ...editing, draftMedia: null }); await load(); } else setError("Görsel silinemedi.");
  }

  async function openEditor(vehicle: Vehicle) {
    setEditing(vehicle); setCreating(false); setRevisions([]); setRevisionsLoading(true);
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

  const formVehicle = editing ?? ({ publicationStatus: "unpublished" } as Vehicle);
  const controlledFields = Object.entries(vehicleTagLabels);
  return <section className="mt-8">
    <div className="flex justify-between gap-4"><h2 className="text-heading-md">{publishedOnly ? "Yayındaki Araçlar" : "Tüm Araçlar"}</h2><button className="rounded-control bg-accent-orange px-5 font-semibold" onClick={() => setCreating(true)}>Yeni Araç</button></div>
    <div className="mt-6 grid gap-3 rounded-card border bg-white p-4 md:grid-cols-3"><input className={fieldClass} onChange={(event) => setQuery(event.target.value)} placeholder="Marka, model veya donanım ara"/><select className={fieldClass} onChange={(event) => setMake(event.target.value)}><option value="">Tüm markalar</option>{(tags.make ?? []).map((tag) => <option key={tag.id} value={tag.value}>{tag.value}</option>)}</select><select className={fieldClass} onChange={(event) => setSegment(event.target.value)}><option value="">Tüm segmentler</option>{(tags.segmentLabel ?? []).map((tag) => <option key={tag.id} value={tag.value}>{tag.value}</option>)}</select></div>
    {error ? <p className="mt-4 text-error">{error}</p> : null}
    <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{shown.map((vehicle) => { const source = vehicle.draftMedia ? `/admin-api/media-file.php?id=${vehicle.draftMedia.id}` : vehicle.coverImage?.src; return <article className="overflow-hidden rounded-card border bg-white" key={vehicle.id}><div className="aspect-video bg-surface-muted">{source ? <img className="size-full object-cover" src={source} alt={vehicle.draftMedia?.alt ?? vehicle.coverImage?.alt ?? ""}/> : null}</div><div className="p-5"><p className="text-sm text-text-secondary">{vehicle.make} · {vehicle.segmentLabel}</p><h3 className="text-lg font-bold">{vehicle.model}</h3><p>{vehicle.trim}</p><p className="mt-3 font-semibold">{vehicle.priceAmountMinor ? `${new Intl.NumberFormat("tr-TR").format(vehicle.priceAmountMinor / 100)} TL + KDV / ay` : "Fiyat girilmemiş"}</p><button className="mt-4 w-full rounded-control border p-2" onClick={() => void openEditor(vehicle)}>Düzenle</button></div></article>; })}</div>
    {(editing || creating) ? <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy/70 p-4"><form className="mx-auto my-8 max-w-3xl rounded-card bg-white p-6" onSubmit={save}><div className="flex justify-between"><h3 className="text-heading-md">{editing ? "Aracı Düzenle" : "Yeni Araç"}</h3><button type="button" onClick={() => { setEditing(null); setCreating(false); }}>Kapat</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">
      {controlledFields.map(([name, label]) => <label className="text-sm font-semibold" key={name}>{label} *<select className={fieldClass} defaultValue={String(formVehicle[name] ?? "")} name={name} required><option value="">Seçin</option>{(tags[name] ?? []).map((tag) => <option key={tag.id} value={tag.value}>{tag.value}</option>)}</select></label>)}
      {[['trim', 'Donanım', true], ['modelYearLabel', 'Model yılı', true], ['transmissionLabel', 'Şanzıman', true], ['slug', 'Slug', true], ['powerHp', 'Motor gücü', false], ['seats', 'Koltuk sayısı', false]].map(([name, label, required]) => <label className="text-sm font-semibold" key={String(name)}>{label}{required ? " *" : ""}<input className={fieldClass} defaultValue={String(formVehicle[String(name)] ?? "")} name={String(name)} required={Boolean(required)}/></label>)}
      <label className="text-sm font-semibold">Aylık liste-net fiyatı (TL)<input className={fieldClass} defaultValue={priceTry(formVehicle)} inputMode="numeric" min="1" name="priceAmountTry" placeholder="40200" step="1" type="number"/></label>
      <label>Yayın durumu<select className={fieldClass} defaultValue={formVehicle.publicationStatus} name="publicationStatus"><option value="unpublished">Yayında değil</option><option value="published">Yayında</option></select></label><label className="sm:col-span-2">Özet *<textarea className={fieldClass} defaultValue={formVehicle.summary} name="summary" required/></label>
      <fieldset className="sm:col-span-2 grid gap-3 rounded-card border p-4 sm:grid-cols-2"><legend>Kapak görseli</legend><input accept="image/jpeg,image/png,image/webp" className="sm:col-span-2" name="image" type="file"/>{[['alt', 'Alternatif metin'], ['creator', 'Oluşturan'], ['sourcePage', 'Kaynak sayfası URL'], ['licenseName', 'Lisans adı'], ['licenseUrl', 'Lisans URL']].map(([name, label]) => <label key={name}>{label}<input className={fieldClass} defaultValue={String(formVehicle.draftMedia?.[name as keyof Media] ?? "")} name={name}/></label>)}{editing?.draftMedia ? <div className="sm:col-span-2 flex gap-3"><a className="border p-2" href={`/admin-api/media-file.php?id=${editing.draftMedia.id}&download=1`}>İndir</a><button className="border border-error p-2 text-error" onClick={removeImage} type="button">Sil</button></div> : null}</fieldset>
      {editing ? <section className="sm:col-span-2 rounded-card bg-surface-muted p-4"><h4 className="font-bold">Değişiklik geçmişi</h4>{revisionsLoading ? <p className="mt-2 text-sm">Yükleniyor…</p> : revisions.length ? <ol className="mt-3 space-y-3">{revisions.map((revision) => <li className="rounded-control bg-white p-3 text-sm" key={revision.id}><div className="flex flex-wrap justify-between gap-2"><strong>{revision.action === "create" ? "Araç oluşturuldu" : "Araç güncellendi"}</strong><time dateTime={revision.timestamp}>{new Date(revision.timestamp).toLocaleString("tr-TR")}</time></div><p className="mt-1 text-text-secondary">Değişen alanlar: {revision.changedFields.join(", ") || "—"}</p>{revision.priceAmountMinor !== null ? <p className="mt-1">Fiyat: {new Intl.NumberFormat("tr-TR").format(revision.priceAmountMinor / 100)} TL + KDV / ay</p> : null}</li>)}</ol> : <p className="mt-2 text-sm text-text-secondary">Henüz kayıtlı bir değişiklik yok.</p>}</section> : null}
    </div><button className="mt-6 min-h-12 w-full rounded-control bg-accent-orange font-bold">Kaydet</button></form></div> : null}
  </section>;
}
