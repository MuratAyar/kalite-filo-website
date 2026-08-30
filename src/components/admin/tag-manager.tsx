"use client";

import { FormEvent, useEffect, useState } from "react";

export type TagGroups = Record<string, { id: string; value: string; custom: boolean; usageCount: number }[]>;

export const vehicleTagLabels: Record<string, string> = {
  make: "Marka",
  model: "Model",
  categoryLabel: "Kategori",
  segmentLabel: "Segment",
  fuelLabel: "Yakıt",
};

export function TagManager({ csrfToken }: { csrfToken: string }) {
  const [groups, setGroups] = useState<TagGroups>({});
  const [active, setActive] = useState("fuelLabel");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/admin-api/tags.php", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setGroups(payload.groups ?? {}))
      .catch(() => setError("Etiketler yüklenemedi."));
  }, []);

  async function operate(operation: string, value: string, nextValue = "") {
    const response = await fetch("/admin-api/tags.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ operation, field: active, value, nextValue }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error === "tag_in_use"
        ? "Kullanımdaki etiket değiştirilemez. Önce bağlı araçları başka etikete taşıyın."
        : "Etiket işlemi tamamlanamadı.");
      return;
    }
    setError("");
    setGroups(payload.groups);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get("value") ?? "").trim();
    if (value) { await operate("create", value); form.reset(); }
  }

  return <section className="mt-8">
    <p className="text-label font-semibold text-corporate-blue">Ayarlar</p>
    <h2 className="mt-1 text-heading-md">Etiketler</h2>
    <p className="mt-2 text-text-secondary">Araç marka, model, kategori, segment ve yakıt seçeneklerini yönetin.</p>
    <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_1fr]">
      <nav className="space-y-1 rounded-card border bg-white p-3" aria-label="Araç etiket grupları">
        {Object.entries(vehicleTagLabels).map(([key, label]) => <button className={`min-h-10 w-full rounded-control px-3 text-left ${active === key ? "bg-brand-navy text-white" : "hover:bg-surface-muted"}`} key={key} onClick={() => setActive(key)}>{label}<span className="float-right text-xs opacity-70">{groups[key]?.length ?? 0}</span></button>)}
      </nav>
      <div className="rounded-card border bg-white p-5">
        <h3 className="text-lg font-bold">{vehicleTagLabels[active]}</h3>
        <form className="mt-4 flex gap-2" onSubmit={create}><input className="min-h-11 flex-1 rounded-control border px-3" name="value" placeholder="Yeni etiket" required/><button className="rounded-control bg-accent-orange px-5 font-semibold">Ekle</button></form>
        {error ? <p className="mt-3 text-error">{error}</p> : null}
        <ul className="mt-5 divide-y">{(groups[active] ?? []).map((tag) => <li className="flex items-center gap-3 py-3" key={tag.id}><span className="flex-1 font-medium">{tag.value}</span><span className="text-xs text-text-secondary">{tag.usageCount} araç</span>{tag.custom && tag.usageCount === 0 ? <><button className="text-sm text-corporate-blue" onClick={() => { const next = prompt("Yeni etiket adı", tag.value); if (next && next !== tag.value) void operate("update", tag.value, next); }}>Düzenle</button><button className="text-sm text-error" onClick={() => void operate("delete", tag.value)}>Sil</button></> : <span className="text-xs text-text-secondary">Kullanımda</span>}</li>)}</ul>
      </div>
    </div>
  </section>;
}
