"use client";

import { ChangeEvent, DragEvent, useId, useState } from "react";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const ADMIN_IMAGE_WIDTH = 1600;
export const ADMIN_IMAGE_HEIGHT = 900;

export async function optimizeAdminImage(file: File, stem: string): Promise<File> {
  if (!acceptedTypes.has(file.type)) throw new Error("unsupported_image");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = ADMIN_IMAGE_WIDTH;
    canvas.height = ADMIN_IMAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("image_processing_unavailable");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.type !== "image/webp") throw new Error("image_processing_unavailable");
    const safeStem = stem.toLocaleLowerCase("tr-TR").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "gorsel";
    return new File([blob], `${safeStem}.webp`, { type: "image/webp", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

export function ImageDropzone({
  files,
  multiple,
  onFiles,
}: {
  files: File[];
  multiple: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  function acceptFiles(list: FileList | File[]) {
    const selected = Array.from(list).filter((file) => acceptedTypes.has(file.type));
    onFiles(multiple ? [...files, ...selected] : selected.slice(0, 1));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) acceptFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFiles(event.dataTransfer.files);
  }

  return (
    <div className="sm:col-span-2">
      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        id={inputId}
        multiple={multiple}
        onChange={handleChange}
        type="file"
      />
      <label
        className={`grid min-h-36 cursor-pointer place-items-center rounded-card border-2 border-dashed px-5 py-6 text-center transition ${dragging ? "border-accent-orange bg-accent-orange/10" : "border-corporate-blue/45 bg-white hover:border-corporate-blue hover:bg-corporate-blue/5"}`}
        htmlFor={inputId}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span>
          <span className="inline-flex min-h-11 items-center rounded-control bg-corporate-blue px-5 font-bold text-white shadow-sm">
            {multiple ? "Görselleri Seç" : "Kapak Görseli Seç"}
          </span>
          <span className="mt-3 block text-sm font-semibold text-brand-navy">veya görselleri buraya sürükleyip bırakın</span>
          <span className="mt-1 block text-xs text-text-secondary">JPEG, PNG veya WebP · otomatik 1600×900 WebP optimizasyonu</span>
        </span>
      </label>
      {files.length ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li className="flex items-center justify-between gap-3 rounded-control border border-border-subtle bg-white px-3 py-2 text-sm" key={`${file.name}-${file.lastModified}-${index}`}>
              <span className="min-w-0 truncate">{file.name}</span>
              <button className="shrink-0 font-semibold text-error hover:underline" onClick={() => onFiles(files.filter((_, itemIndex) => itemIndex !== index))} type="button">Kaldır</button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
