"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
type Block = {
  id?: string;
  type: "hero" | "text" | "cta" | "divider" | "vehicle_cards" | "article_cards";
  heading?: string;
  text?: string;
  label?: string;
  url?: string;
  entityIds?: string[];
};
type Campaign = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  content: Block[];
  status: string;
  revision: number;
  updatedAt: string;
};
type Summary = {
  uniqueContacts: number;
  eligible: number;
  sendable: number;
  unsubscribed: number;
  missingConsent: number;
  iysBlocked: number;
  environmentBlocked: number;
};
type ReferenceOption = { id: string; label: string };
type QueueSummary = {
  id: string;
  campaignId: string;
  campaignRevision: number;
  status: string;
  deliveryMode: string;
  statistics: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    skipped: number;
  };
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};
const control =
  "mt-1 min-h-11 w-full rounded-control border border-border-control bg-white px-3";
const blankBlock: Block = { type: "text", heading: "", text: "" };
export function CampaignManager({
  csrfToken,
  canEdit,
  canQueue,
}: {
  csrfToken: string;
  canEdit: boolean;
  canQueue: boolean;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([{ ...blankBlock }]);
  const [error, setError] = useState("");
  const [referenceOptions, setReferenceOptions] = useState<{
    vehicles: ReferenceOption[];
    articles: ReferenceOption[];
  }>({ vehicles: [], articles: [] });
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [testRecipients, setTestRecipients] = useState<ReferenceOption[]>([]);
  const [testRecipientId, setTestRecipientId] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("disabled");
  const [queueing, setQueueing] = useState(false);
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  async function load() {
    try {
      const response = await fetch("/admin-api/campaigns.php", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await response.json();
      if (
        !response.ok ||
        !Array.isArray(payload.campaigns) ||
        !payload.audienceSummary
      )
        throw new Error();
      setCampaigns(payload.campaigns);
      setSummary(payload.audienceSummary);
      setDeliveryEnabled(payload.deliveryEnabled === true);
      setReferenceOptions({
        vehicles: Array.isArray(payload.referenceOptions?.vehicles)
          ? payload.referenceOptions.vehicles
          : [],
        articles: Array.isArray(payload.referenceOptions?.articles)
          ? payload.referenceOptions.articles
          : [],
      });
      setError("");
      if (canEdit) {
        const testResponse = await fetch("/admin-api/campaign-test.php", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const testPayload = await testResponse.json();
        if (testResponse.ok && Array.isArray(testPayload.recipients)) {
          setTestRecipients(testPayload.recipients);
          setTestRecipientId(
            (current) => current || testPayload.recipients[0]?.id || "",
          );
        }
      }
      if (canQueue) {
        const queueResponse = await fetch("/admin-api/campaign-queue.php", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const queuePayload = await queueResponse.json();
        if (queueResponse.ok && typeof queuePayload.deliveryMode === "string") {
          setDeliveryMode(queuePayload.deliveryMode);
          setQueues(
            Array.isArray(queuePayload.queues) ? queuePayload.queues : [],
          );
        }
      }
    } catch {
      setError("Kampanyalar yüklenemedi.");
    }
  }
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */
  function open(campaign: Campaign) {
    setEditing(campaign);
    setCreating(false);
    setBlocks(campaign.content);
    setPreviewHtml("");
    setNotice("");
  }
  function start() {
    setEditing(null);
    setCreating(true);
    setBlocks([{ ...blankBlock }]);
    setPreviewHtml("");
    setNotice("");
  }
  function updateBlock(index: number, patch: Partial<Block>) {
    setBlocks((current) =>
      current.map((block, i) => (i === index ? { ...block, ...patch } : block)),
    );
  }
  function currentBody(form: HTMLFormElement) {
    const data = new FormData(form);
    return {
      name: data.get("name"),
      subject: data.get("subject"),
      preheader: data.get("preheader"),
      content: blocks,
    };
  }
  async function preview() {
    if (!formRef.current) return;
    setPreviewing(true);
    try {
      const response = await fetch("/admin-api/campaign-preview.php", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(currentBody(formRef.current)),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.html !== "string") throw new Error();
      setPreviewHtml(payload.html);
      setError("");
    } catch {
      setError("Markalı kampanya önizlemesi oluşturulamadı.");
    } finally {
      setPreviewing(false);
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = currentBody(event.currentTarget);
    try {
      const response = await fetch(
        editing
          ? `/admin-api/campaign.php?id=${encodeURIComponent(editing.id)}`
          : "/admin-api/campaigns.php",
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
      if (!response.ok) throw new Error();
      setEditing(null);
      setCreating(false);
      await load();
    } catch {
      setError(
        "Kampanya kaydedilemedi. Zorunlu alanları ve CTA URL değerini kontrol edin.",
      );
    }
  }
  async function sendTest() {
    if (!editing || !testRecipientId) return;
    setTestSending(true);
    setNotice("");
    try {
      const response = await fetch("/admin-api/campaign-test.php", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          campaignId: editing.id,
          recipientId: testRecipientId,
        }),
      });
      if (!response.ok) throw new Error();
      setNotice("Test e-postası izinli alıcıya gönderildi.");
      setError("");
    } catch {
      setError(
        "Test e-postası gönderilemedi. Allowlist, SMTP yapılandırması veya hız sınırını kontrol edin.",
      );
    } finally {
      setTestSending(false);
    }
  }
  async function queueCampaign() {
    if (!editing || deliveryMode === "disabled") return;
    const confirmation = window.prompt(
      `Kuyruk oluşturmak için kampanya adını aynen yazın:\n${editing.name}`,
    );
    if (confirmation === null) return;
    setQueueing(true);
    setNotice("");
    try {
      const response = await fetch("/admin-api/campaign-queue.php", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ campaignId: editing.id, confirmation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error();
      setNotice(
        `Kuyruk hazırlandı: ${payload.queue.statistics.total} alıcı · ${payload.queue.deliveryMode}`,
      );
      await load();
    } catch {
      setError(
        "Kampanya kuyruğu oluşturulamadı. Onay metnini, audience uygunluğunu ve delivery mode ayarını kontrol edin.",
      );
    } finally {
      setQueueing(false);
    }
  }
  async function cancelQueue(queue: QueueSummary) {
    if (!window.confirm("Bu bekleyen kampanya kuyruğu iptal edilsin mi?"))
      return;
    try {
      const response = await fetch("/admin-api/campaign-queue.php", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ queueId: queue.id, action: "cancel" }),
      });
      if (!response.ok) throw new Error();
      setNotice("Bekleyen kampanya kuyruğu iptal edildi.");
      await load();
    } catch {
      setError("Kuyruk iptal edilemedi; worker işlemi başlatmış olabilir.");
    }
  }
  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-label font-semibold text-corporate-blue">
            Gönderim kapalı taslak alanı
          </p>
          <h2 className="mt-1 text-heading-md">Mail Kampanyaları</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Taslak oluşturun, markalı önizlemeyi kontrol edin, izinli test
            alıcısına gönderin ve yapılandırılmış queue geçmişini izleyin.
          </p>
        </div>
        {canEdit ? (
          <button
            className="min-h-11 rounded-control bg-accent-orange px-5 font-bold"
            onClick={start}
          >
            Yeni Kampanya
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-5 rounded-control bg-error-surface p-4 text-error">
          {error}
        </p>
      ) : null}
      {summary ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Benzersiz kişi", summary.uniqueContacts],
            ["Hukuken uygun", summary.eligible],
            ["Bu ortamda gönderilebilir", summary.sendable],
            ["İYS nedeniyle bloklu", summary.iysBlocked],
            ["Consent eksik", summary.missingConsent],
            ["Unsubscribed", summary.unsubscribed],
            ["Staging bloklu", summary.environmentBlocked],
            ["Gönderim motoru", deliveryEnabled ? "Aktif" : "Kapalı"],
          ].map(([label, value]) => (
            <div
              className="rounded-card border bg-surface-card p-4"
              key={label}
            >
              <dt className="text-sm text-text-secondary">{label}</dt>
              <dd className="mt-2 text-2xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {canQueue ? (
        <section className="mt-7 rounded-card border bg-surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Gönderim Geçmişi</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Private recipient adresleri gösterilmez. Mod: {deliveryMode}
              </p>
            </div>
            <button
              className="rounded-control border px-4 py-2 text-sm font-semibold"
              onClick={() => void load()}
              type="button"
            >
              Yenile
            </button>
          </div>
          {queues.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-text-secondary">
                  <tr>
                    <th className="py-2 pr-4">Kampanya</th>
                    <th className="py-2 pr-4">Durum</th>
                    <th className="py-2 pr-4">Toplam</th>
                    <th className="py-2 pr-4">Gönderilen</th>
                    <th className="py-2 pr-4">Başarısız</th>
                    <th className="py-2 pr-4">Atlanan</th>
                    <th className="py-2 pr-4">Oluşturulma</th>
                    <th className="py-2">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.map((queue) => (
                    <tr className="border-t" key={queue.id}>
                      <td className="py-3 pr-4 font-semibold">
                        {campaigns.find(
                          (campaign) => campaign.id === queue.campaignId,
                        )?.name ?? queue.campaignId}
                        <span className="ml-2 text-xs font-normal text-text-secondary">
                          r{queue.campaignRevision}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-pill bg-surface-muted px-2 py-1 text-xs font-semibold">
                          {queue.status} · {queue.deliveryMode}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{queue.statistics.total}</td>
                      <td className="py-3 pr-4">{queue.statistics.sent}</td>
                      <td className="py-3 pr-4">{queue.statistics.failed}</td>
                      <td className="py-3 pr-4">{queue.statistics.skipped}</td>
                      <td className="py-3 pr-4">
                        {new Date(queue.createdAt).toLocaleString("tr-TR")}
                      </td>
                      <td className="py-3">
                        {queue.status === "queued" ? (
                          <button
                            className="text-sm font-semibold text-error"
                            onClick={() => void cancelQueue(queue)}
                            type="button"
                          >
                            İptal Et
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-secondary">
              Henüz kampanya kuyruğu yok.
            </p>
          )}
        </section>
      ) : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign) => (
          <button
            className="rounded-card border bg-surface-card p-5 text-left"
            key={campaign.id}
            onClick={() => open(campaign)}
          >
            <span className="rounded-pill bg-surface-muted px-3 py-1 text-xs font-semibold">
              {campaign.status}
            </span>
            <h3 className="mt-3 text-lg font-bold">{campaign.name}</h3>
            <p className="mt-1 text-sm text-text-secondary">
              {campaign.subject}
            </p>
            <p className="mt-4 text-xs text-text-secondary">
              Revizyon {campaign.revision} ·{" "}
              {new Date(campaign.updatedAt).toLocaleString("tr-TR")}
            </p>
          </button>
        ))}
      </div>
      {!campaigns.length ? (
        <p className="mt-6 text-text-secondary">Henüz kampanya taslağı yok.</p>
      ) : null}
      {creating || editing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy/75 p-4">
          <form
            className="mx-auto my-6 max-w-4xl rounded-card bg-page p-6"
            onSubmit={save}
            ref={formRef}
          >
            <div className="flex justify-between">
              <div>
                <h3 className="text-heading-md">
                  {editing ? "Kampanyayı Düzenle" : "Yeni Kampanya"}
                </h3>
                <p className="text-sm text-text-secondary">
                  Mandatory footer ve unsubscribe bağlantısı gönderim aşamasında
                  sistem tarafından eklenir.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
                type="button"
              >
                Kapat
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              <label>
                Kampanya adı *
                <input
                  className={control}
                  defaultValue={editing?.name}
                  maxLength={160}
                  name="name"
                  required
                />
              </label>
              <label>
                E-posta konusu *
                <input
                  className={control}
                  defaultValue={editing?.subject}
                  maxLength={180}
                  name="subject"
                  required
                />
              </label>
              <label>
                Preheader
                <input
                  className={control}
                  defaultValue={editing?.preheader}
                  maxLength={240}
                  name="preheader"
                />
              </label>
            </div>
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">İçerik blokları</h4>
                <button
                  className="rounded-control border px-3 py-2 text-sm"
                  onClick={() =>
                    setBlocks((current) => [...current, { ...blankBlock }])
                  }
                  type="button"
                >
                  Blok Ekle
                </button>
              </div>
              <div className="mt-3 space-y-4">
                {blocks.map((block, index) => (
                  <fieldset
                    className="rounded-card border bg-white p-4"
                    key={block.id ?? index}
                  >
                    <div className="flex gap-3">
                      <select
                        className={control}
                        onChange={(event) =>
                          updateBlock(index, {
                            type: event.target.value as Block["type"],
                          })
                        }
                        value={block.type}
                      >
                        <option value="hero">Hero</option>
                        <option value="text">Metin</option>
                        <option value="cta">CTA</option>
                        <option value="divider">Ayırıcı</option>
                        <option value="vehicle_cards">Araç kartları</option>
                        <option value="article_cards">
                          Filo Rehberi kartları
                        </option>
                      </select>
                      <button
                        className="text-sm text-error"
                        disabled={blocks.length === 1}
                        onClick={() =>
                          setBlocks((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                        type="button"
                      >
                        Kaldır
                      </button>
                    </div>
                    {block.type === "hero" || block.type === "text" ? (
                      <>
                        <input
                          className={control}
                          onChange={(event) =>
                            updateBlock(index, { heading: event.target.value })
                          }
                          placeholder="Başlık"
                          value={block.heading ?? ""}
                        />
                        <textarea
                          className={control}
                          onChange={(event) =>
                            updateBlock(index, { text: event.target.value })
                          }
                          placeholder="İçerik"
                          rows={5}
                          value={block.text ?? ""}
                        />
                      </>
                    ) : block.type === "cta" ? (
                      <>
                        <input
                          className={control}
                          onChange={(event) =>
                            updateBlock(index, { label: event.target.value })
                          }
                          placeholder="Buton etiketi"
                          value={block.label ?? ""}
                        />
                        <input
                          className={control}
                          onChange={(event) =>
                            updateBlock(index, { url: event.target.value })
                          }
                          placeholder="https://..."
                          type="url"
                          value={block.url ?? ""}
                        />
                      </>
                    ) : block.type === "vehicle_cards" ||
                      block.type === "article_cards" ? (
                      <label className="mt-3 block text-sm font-semibold">
                        {block.type === "vehicle_cards"
                          ? "Yayındaki araçlar"
                          : "Yayındaki Filo Rehberi içerikleri"}
                        <select
                          className={`${control} min-h-36 py-2`}
                          multiple
                          onChange={(event) =>
                            updateBlock(index, {
                              entityIds: Array.from(
                                event.currentTarget.selectedOptions,
                                (option) => option.value,
                              ),
                            })
                          }
                          value={block.entityIds ?? []}
                        >
                          {(block.type === "vehicle_cards"
                            ? referenceOptions.vehicles
                            : referenceOptions.articles
                          ).map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <span className="mt-2 block font-normal text-text-secondary">
                          Birden fazla seçim için Ctrl/Cmd tuşunu kullanın. En
                          fazla 8 kayıt seçilebilir.
                        </span>
                      </label>
                    ) : (
                      <p className="mt-3 text-sm text-text-secondary">
                        Yatay ayırıcı
                      </p>
                    )}
                  </fieldset>
                ))}
              </div>
            </section>
            <section className="mt-6 rounded-card border bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Önizleme
              </p>
              <h4 className="mt-3 text-xl font-bold">
                {editing?.subject ||
                  "E-posta konusu kaydedildiğinde burada görünür"}
              </h4>
              <div className="mt-5 space-y-5">
                {blocks.map((block, index) =>
                  block.type === "divider" ? (
                    <hr key={index} />
                  ) : block.type === "cta" ? (
                    <span
                      className="inline-block rounded-control bg-accent-orange px-5 py-3 font-bold"
                      key={index}
                    >
                      {block.label || "CTA"}
                    </span>
                  ) : (
                    <div key={index}>
                      {block.heading ? (
                        <h5 className="font-bold">{block.heading}</h5>
                      ) : null}
                      <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                        {block.text}
                      </p>
                    </div>
                  ),
                )}
              </div>
              <hr className="my-6" />
              <p className="text-xs text-text-secondary">
                Kalite Filo · Zorunlu iletişim ve abonelikten ayrılma alanı
                gönderim aşamasında eklenir.
              </p>
              <button
                className="mt-5 rounded-control border px-4 py-2 font-semibold"
                disabled={previewing}
                onClick={() => void preview()}
                type="button"
              >
                {previewing ? "Hazırlanıyor..." : "Markalı Önizleme Oluştur"}
              </button>
              {previewHtml ? (
                <iframe
                  className="mt-5 min-h-[620px] w-full rounded-control border bg-white"
                  sandbox=""
                  srcDoc={previewHtml}
                  title="Kampanya e-posta önizlemesi"
                />
              ) : null}
            </section>
            <button className="mt-6 min-h-11 w-full rounded-control bg-accent-orange font-bold">
              Taslağı Kaydet
            </button>
            {editing ? (
              <section className="mt-5 rounded-card border bg-white p-5">
                <h4 className="font-bold">Test e-postası</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  Yalnızca private config allowlist’indeki adreslere, taslağın
                  son kaydedilmiş sürümü gönderilir.
                </p>
                {testRecipients.length ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <select
                      className={control}
                      onChange={(event) =>
                        setTestRecipientId(event.target.value)
                      }
                      value={testRecipientId}
                    >
                      {testRecipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="min-h-11 shrink-0 rounded-control border px-5 font-semibold"
                      disabled={testSending}
                      onClick={() => void sendTest()}
                      type="button"
                    >
                      {testSending ? "Gönderiliyor..." : "Test Mail Gönder"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-text-secondary">
                    Bu ortam için izinli test alıcısı tanımlanmamış.
                  </p>
                )}
                {notice ? (
                  <p className="mt-3 text-sm text-success">{notice}</p>
                ) : null}
              </section>
            ) : null}
            {editing && canQueue ? (
              <section className="mt-5 rounded-card border border-warning bg-white p-5">
                <h4 className="font-bold">Kampanya kuyruğu</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  Mod: {deliveryMode}. Kuyruk, kaydedilmiş revizyonu ve o andaki
                  uygun audience’ı değişmez olarak dondurur.
                </p>
                <button
                  className="mt-4 min-h-11 rounded-control border px-5 font-semibold disabled:opacity-50"
                  disabled={deliveryMode === "disabled" || queueing}
                  onClick={() => void queueCampaign()}
                  type="button"
                >
                  {queueing ? "Hazırlanıyor..." : "Onayla ve Kuyruğa Al"}
                </button>
              </section>
            ) : null}
          </form>
        </div>
      ) : null}
    </section>
  );
}
