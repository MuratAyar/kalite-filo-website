/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type TranslationState = { complete: boolean; slug?: string | null };
type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryId: string;
  publishedAt: string;
  readingMinutes: number;
  featured: boolean;
  publicationStatus: string;
  coverImage?: { src: string; alt: string } | null;
  translations: { tr: TranslationState; en: TranslationState };
};
type DraftLocale = {
  status: "draft" | "ready";
  title: string;
  slug: string;
  excerpt: string;
  coverAlt: string;
  publishedAt: string;
  readingMinutes: number | null;
  seoTitle: string;
  metaDescription: string;
  markdown: string;
};
type Draft = {
  id: string;
  categoryId: string;
  featured: boolean;
  coverMediaId: string | null;
  revision: number;
  updatedAt: string;
  locales: { tr: DraftLocale; en: DraftLocale | null };
};
type CoverMedia = {
  id: string;
  originalName: string;
  alt: { tr: string; en: string };
  usage: string;
};
type Revision = {
  id: string;
  timestamp: string;
  action: string;
  actorId: string | null;
  revision: number;
  changedFields: string[];
};
const categoryLabels: Record<string, string> = {
  "uzun-donem-kiralama": "Uzun Dönem Kiralama",
  "maliyet-ve-finans": "Maliyet ve Finans",
  "arac-rehberi": "Araç Rehberi",
  "filo-yonetimi": "Filo Yönetimi",
  "elektrikli-araclar": "Elektrikli Araçlar",
  "bakim-ve-hasar": "Bakım ve Hasar",
};
const controlClass =
  "mt-1 min-h-11 w-full rounded-control border border-border-control bg-white px-3";
const blankLocale: DraftLocale = {
  status: "draft",
  title: "",
  slug: "",
  excerpt: "",
  coverAlt: "",
  publishedAt: "",
  readingMinutes: null,
  seoTitle: "",
  metaDescription: "",
  markdown: "",
};

export function ArticleListView({
  csrfToken,
  canEdit,
}: {
  csrfToken: string;
  canEdit: boolean;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [media, setMedia] = useState<CoverMedia[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);
  const [locale, setLocale] = useState<"tr" | "en">("tr");
  const [includeEnglish, setIncludeEnglish] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  async function load() {
    try {
      const [response, mediaResponse] = await Promise.all([
        fetch("/admin-api/articles.php", {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch("/admin-api/media.php", {
          credentials: "same-origin",
          cache: "no-store",
        }),
      ]);
      const payload = await response.json();
      const mediaPayload = await mediaResponse.json();
      if (
        !response.ok ||
        !Array.isArray(payload.articles) ||
        !Array.isArray(payload.drafts) ||
        !mediaResponse.ok ||
        !Array.isArray(mediaPayload.media)
      )
        throw new Error("unavailable");
      setArticles(payload.articles);
      setDrafts(payload.drafts);
      setMedia(mediaPayload.media);
      setError("");
    } catch {
      setError("Filo Rehberi içerikleri şu anda yüklenemiyor.");
    } finally {
      setLoading(false);
    }
  }
  // Initial synchronization is limited to the authenticated admin island.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  const shown = useMemo(
    () =>
      articles.filter(
        (article) =>
          (!category || article.categoryId === category) &&
          (!translation ||
            (translation === "complete"
              ? article.translations.en.complete
              : !article.translations.en.complete)) &&
          `${article.title} ${article.excerpt}`
            .toLocaleLowerCase("tr")
            .includes(query.toLocaleLowerCase("tr")),
      ),
    [articles, query, category, translation],
  );
  async function openDraft(draft: Draft) {
    setDirty(false);
    setEditing(draft);
    setCreating(false);
    setLocale("tr");
    setIncludeEnglish(draft.locales.en !== null);
    setPreviewHtml("");
    setRevisions([]);
    try {
      const response = await fetch(
        `/admin-api/article-revisions.php?id=${encodeURIComponent(draft.id)}`,
        { credentials: "same-origin", cache: "no-store" },
      );
      const payload = await response.json();
      if (response.ok && Array.isArray(payload.revisions))
        setRevisions(payload.revisions);
    } catch {
      setError("İçerik geçmişi yüklenemedi.");
    }
  }
  function localePayload(form: FormData, code: "tr" | "en"): DraftLocale {
    return {
      status: form.get(`${code}.status`) === "ready" ? "ready" : "draft",
      title: String(form.get(`${code}.title`) ?? ""),
      slug: String(form.get(`${code}.slug`) ?? ""),
      excerpt: String(form.get(`${code}.excerpt`) ?? ""),
      coverAlt: String(form.get(`${code}.coverAlt`) ?? ""),
      publishedAt: String(form.get(`${code}.publishedAt`) ?? ""),
      readingMinutes:
        String(form.get(`${code}.readingMinutes`) ?? "") === ""
          ? null
          : Number(form.get(`${code}.readingMinutes`)),
      seoTitle: String(form.get(`${code}.seoTitle`) ?? ""),
      metaDescription: String(form.get(`${code}.metaDescription`) ?? ""),
      markdown: String(form.get(`${code}.markdown`) ?? ""),
    };
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const selectedCover = String(form.get("coverMediaId") ?? "");
    const body = {
      categoryId: String(form.get("categoryId") ?? ""),
      featured: form.get("featured") === "on",
      coverMediaId: selectedCover || null,
      locales: {
        tr: localePayload(form, "tr"),
        en:
          form.get("includeEnglish") === "on"
            ? localePayload(form, "en")
            : null,
      },
    };
    const response = await fetch(
      editing
        ? `/admin-api/article.php?id=${encodeURIComponent(editing.id)}`
        : "/admin-api/articles.php",
      {
        method: editing ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      setError(
        "İçerik kaydedilemedi. Zorunlu alanları, slug değerlerini ve hazır durumundaki metadata alanlarını kontrol edin.",
      );
      return;
    }
    setDirty(false);
    setEditing(null);
    setCreating(false);
    setPreviewHtml("");
    await load();
  }
  async function preview() {
    const form = formRef.current;
    if (!form) return;
    setPreviewing(true);
    setError("");
    try {
      const data = new FormData(form);
      const response = await fetch("/admin-api/article-preview.php", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          markdown: String(data.get(`${locale}.markdown`) ?? ""),
        }),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.html !== "string")
        throw new Error("preview");
      setPreviewHtml(payload.html);
    } catch {
      setError("Markdown önizlemesi oluşturulamadı.");
    } finally {
      setPreviewing(false);
    }
  }
  async function importPublished(article: Article) {
    if (
      !canEdit ||
      !window.confirm(
        `“${article.title}” içeriği düzenlenebilir private draft'a aktarılsın mı?`,
      )
    )
      return;
    setImportingId(article.id);
    setError("");
    try {
      const response = await fetch("/admin-api/article-import.php", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ id: article.id }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.article)
        throw new Error(response.status === 409 ? "already" : "failed");
      const imported = payload.article as Draft;
      await load();
      await openDraft(imported);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === "already"
          ? "Bu yayın içeriği zaten private draft'a aktarılmış."
          : "Yayın içeriği private draft'a aktarılamadı.",
      );
    } finally {
      setImportingId(null);
    }
  }
  const closeEditor = useCallback(() => {
    if (
      dirty &&
      !window.confirm(
        "Kaydedilmemiş değişiklikleriniz var. Düzenleme ekranını kapatmak istediğinizden emin misiniz?",
      )
    )
      return;
    setDirty(false);
    setEditing(null);
    setCreating(false);
  }, [dirty]);
  useEffect(() => {
    if (!editing && !creating) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditor();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, creating, closeEditor]);
  const formDraft =
    editing ??
    ({
      id: "new",
      categoryId: "filo-yonetimi",
      featured: false,
      coverMediaId: null,
      revision: 0,
      updatedAt: "",
      locales: { tr: blankLocale, en: null },
    } as Draft);
  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label font-semibold text-corporate-blue">
            İçerik yönetimi
          </p>
          <h2 className="mt-1 text-heading-md">Filo Rehberi</h2>
        </div>
        {canEdit ? (
          <button
            className="min-h-11 rounded-control bg-accent-orange px-5 font-semibold"
            onClick={() => {
              setDirty(false);
              setCreating(true);
              setEditing(null);
              setLocale("tr");
              setIncludeEnglish(false);
              setPreviewHtml("");
            }}
          >
            Yeni İçerik
          </button>
        ) : null}
      </div>
      {drafts.length ? (
        <section className="mt-6 rounded-card border border-accent-orange/30 bg-accent-orange/5 p-5">
          <h3 className="font-bold">Private draft’lar ({drafts.length})</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {drafts.map((draft) => (
              <button
                className="rounded-control border bg-white p-4 text-left"
                key={draft.id}
                onClick={() => void openDraft(draft)}
              >
                <strong>{draft.locales.tr.title}</strong>
                <span className="mt-1 block text-sm text-text-secondary">
                  Revizyon {draft.revision} ·{" "}
                  {draft.locales.en ? "TR + EN" : "Yalnızca TR"}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mt-6 grid gap-3 rounded-card border border-border-subtle bg-surface-card p-4 md:grid-cols-3">
        <input
          className={controlClass}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Başlık veya özette ara"
        />
        <select
          className={controlClass}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Tüm kategoriler</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className={controlClass}
          onChange={(event) => setTranslation(event.target.value)}
        >
          <option value="">Tüm çeviri durumları</option>
          <option value="complete">İngilizce tamamlandı</option>
          <option value="missing">İngilizce eksik</option>
        </select>
      </div>
      {error ? (
        <p
          className="mt-5 rounded-control bg-error-surface px-4 py-3 text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="mt-6 text-text-secondary">İçerikler yükleniyor…</p>
      ) : null}
      {!loading ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {shown.map((article) => {
            const existingDraft = drafts.find(
              (draft) => draft.id === article.id,
            );
            return (
              <article
                className="group relative grid overflow-hidden rounded-card border border-border-subtle bg-surface-card transition hover:border-corporate-blue hover:shadow-md sm:grid-cols-[12rem_1fr]"
                key={article.id}
              >
                {canEdit ? (
                  <button
                    aria-label={`${article.title} içeriğini ${existingDraft ? "düzenle" : "private draft'a aktar"}`}
                    className="absolute inset-0 z-10 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corporate-blue disabled:cursor-wait"
                    disabled={importingId === article.id}
                    onClick={() =>
                      existingDraft
                        ? void openDraft(existingDraft)
                        : void importPublished(article)
                    }
                    type="button"
                  />
                ) : null}
                <div className="pointer-events-none relative aspect-video bg-surface-muted sm:aspect-auto">
                  {article.coverImage ? (
                    <img
                      alt={article.coverImage.alt}
                      className="size-full object-cover"
                      src={article.coverImage.src}
                    />
                  ) : (
                    <div className="grid size-full min-h-36 place-items-center text-sm text-text-secondary">
                      Kapak görseli yok
                    </div>
                  )}
                </div>
                <div className="pointer-events-none relative p-5">
                  <span className="rounded-pill bg-surface-muted px-3 py-1 text-xs font-semibold">
                    {categoryLabels[article.categoryId] ?? article.categoryId}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
                    {article.excerpt}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                    <span>{article.readingMinutes} dk.</span>
                    <span className="text-success">TR</span>
                    <span
                      className={
                        article.translations.en.complete
                          ? "text-success"
                          : "text-error"
                      }
                    >
                      {article.translations.en.complete ? "EN" : "EN eksik"}
                    </span>
                    <span className="text-text-secondary">
                      Yayındaki kaynak · salt okunur
                    </span>
                    {canEdit ? (
                      <span className="ml-auto rounded-control border border-corporate-blue px-3 py-2 font-semibold text-corporate-blue group-hover:bg-corporate-blue group-hover:text-white">
                        {existingDraft
                          ? "Draft’ı Düzenle"
                          : importingId === article.id
                            ? "Aktarılıyor…"
                            : "Private Draft’a Aktar"}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {creating || editing ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy/75 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <form
            className="mx-auto my-5 max-w-6xl rounded-card bg-page p-5 sm:p-7"
            key={formDraft.id}
            onInput={() => setDirty(true)}
            onSubmit={save}
            ref={formRef}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-heading-md">
                  {editing ? "Draft Düzenle" : "Yeni Filo Rehberi İçeriği"}
                </h3>
                <p className="text-sm text-text-secondary">
                  Public site ancak kontrollü yayınlama aşamasında değişir.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
              >
                Kapat
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                Kategori *
                <select
                  className={controlClass}
                  defaultValue={formDraft.categoryId}
                  name="categoryId"
                  required
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 self-end pb-3">
                <input
                  defaultChecked={formDraft.featured}
                  name="featured"
                  type="checkbox"
                />
                Öne çıkan içerik adayı
              </label>
              <label className="sm:col-span-2">
                Kapak görseli
                <select
                  className={controlClass}
                  defaultValue={formDraft.coverMediaId ?? ""}
                  name="coverMediaId"
                >
                  <option value="">Henüz private kapak seçilmedi</option>
                  {media
                    .filter((asset) => asset.usage === "article" || asset.usage === "general")
                    .map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.originalName} · {asset.alt.tr}
                      </option>
                    ))}
                </select>
                <span className="mt-1 block text-xs text-text-secondary">
                  Yeni görselleri Medya bölümünden yükleyebilirsiniz.
                </span>
              </label>
              <label className="sm:col-span-2 flex items-center gap-2">
                <input
                  checked={includeEnglish}
                  name="includeEnglish"
                  onChange={(event) => {
                    setIncludeEnglish(event.target.checked);
                    if (!event.target.checked) setLocale("tr");
                  }}
                  type="checkbox"
                />
                İngilizce içerik girilecek
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                className={`rounded-control px-4 py-2 ${locale === "tr" ? "bg-brand-navy text-white" : "border bg-white"}`}
                onClick={() => {
                  setLocale("tr");
                  setPreviewHtml("");
                }}
                type="button"
              >
                Türkçe
              </button>
              <button
                className={`rounded-control px-4 py-2 ${locale === "en" ? "bg-brand-navy text-white" : "border bg-white"}`}
                disabled={!includeEnglish}
                onClick={() => {
                  setLocale("en");
                  setPreviewHtml("");
                }}
                type="button"
              >
                English
              </button>
            </div>
            {(["tr", "en"] as const).map((code) => {
              const content = formDraft.locales[code] ?? blankLocale;
              return (
                <fieldset
                  className={
                    locale === code
                      ? "mt-5 grid gap-4 sm:grid-cols-2"
                      : "hidden"
                  }
                  key={code}
                >
                  <legend className="sr-only">{code}</legend>
                  <label>
                    Durum
                    <select
                      className={controlClass}
                      defaultValue={content.status}
                      name={`${code}.status`}
                    >
                      <option value="draft">Draft</option>
                      <option value="ready">Hazır</option>
                    </select>
                  </label>
                  <label>
                    Slug *
                    <input
                      className={controlClass}
                      defaultValue={content.slug}
                      name={`${code}.slug`}
                      required={code === "tr"}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Başlık *
                    <input
                      className={controlClass}
                      defaultValue={content.title}
                      maxLength={160}
                      name={`${code}.title`}
                      required={code === "tr"}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Özet
                    <textarea
                      className={controlClass}
                      defaultValue={content.excerpt}
                      maxLength={600}
                      name={`${code}.excerpt`}
                      rows={3}
                    />
                  </label>
                  <label>
                    Yayın tarihi
                    <input
                      className={controlClass}
                      defaultValue={content.publishedAt}
                      name={`${code}.publishedAt`}
                      type="date"
                    />
                  </label>
                  <label>
                    Okuma süresi
                    <input
                      className={controlClass}
                      defaultValue={content.readingMinutes ?? ""}
                      min={1}
                      max={120}
                      name={`${code}.readingMinutes`}
                      type="number"
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Kapak alternatif metni
                    <input
                      className={controlClass}
                      defaultValue={content.coverAlt}
                      maxLength={300}
                      name={`${code}.coverAlt`}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    SEO başlığı
                    <input
                      className={controlClass}
                      defaultValue={content.seoTitle}
                      maxLength={180}
                      name={`${code}.seoTitle`}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Meta açıklaması
                    <textarea
                      className={controlClass}
                      defaultValue={content.metaDescription}
                      maxLength={320}
                      name={`${code}.metaDescription`}
                      rows={2}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Markdown *
                    <textarea
                      className={`${controlClass} min-h-80 font-mono text-sm`}
                      defaultValue={content.markdown}
                      name={`${code}.markdown`}
                      required={code === "tr"}
                    />
                  </label>
                </fieldset>
              );
            })}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-control border border-corporate-blue px-5 py-3 font-semibold text-corporate-blue"
                disabled={previewing}
                onClick={() => void preview()}
                type="button"
              >
                {previewing ? "Hazırlanıyor…" : "Önizleme Oluştur"}
              </button>
              {canEdit ? (
                <button className="rounded-control bg-accent-orange px-6 py-3 font-bold">
                  Draft’ı Kaydet
                </button>
              ) : null}
            </div>
            {previewHtml ? (
              <section className="mt-6 rounded-card border bg-white p-6">
                <h4 className="mb-4 font-bold">
                  Güvenli önizleme · {locale.toUpperCase()}
                </h4>
                <div
                  className="space-y-3 [&_a]:text-corporate-blue [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </section>
            ) : null}
            {editing ? (
              <section className="mt-6 rounded-card border bg-white p-5">
                <h4 className="font-bold">Değişiklik geçmişi</h4>
                {revisions.length ? (
                  <ul className="mt-3 space-y-2">
                    {revisions.map((revision) => (
                      <li
                        className="rounded-control bg-surface-muted p-3 text-sm"
                        key={revision.id}
                      >
                        <strong>Revizyon {revision.revision}</strong> ·{" "}
                        {new Date(revision.timestamp).toLocaleString("tr-TR")}
                        <span className="block text-text-secondary">
                          {revision.changedFields.join(", ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-secondary">
                    Henüz geçmiş kaydı yok.
                  </p>
                )}
              </section>
            ) : null}
          </form>
        </div>
      ) : null}
    </section>
  );
}
