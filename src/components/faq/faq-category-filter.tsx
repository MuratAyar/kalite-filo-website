"use client";

import { useState } from "react";

import type { FaqCategory, FaqEntry } from "@/types";

import { classNames } from "@/components/ui/class-names";

export type FaqCategoryFilterProps = {
  categories: readonly FaqCategory[];
  entries: readonly FaqEntry[];
  locale?: "en" | "tr";
};

type SelectedCategoryId = FaqCategory["id"] | "all";

export function FaqCategoryFilter({
  categories,
  entries,
  locale = "tr",
}: FaqCategoryFilterProps) {
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<SelectedCategoryId>("all");
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const visibleEntries =
    selectedCategoryId === "all"
      ? entries
      : entries.filter((entry) => entry.categoryId === selectedCategoryId);

  const controls = [
    { id: "all" as const, label: locale === "en" ? "All" : "Tümü" },
    ...categories.map((category) => ({
      id: category.id,
      label: category.label,
    })),
  ];

  return (
    <>
      <div
        aria-label={locale === "en" ? "Frequently asked question categories" : "Sıkça sorulan soru kategorileri"}
        data-faq-category-filter="true"
        role="group"
      >
        <ul className="mobile-category-track flex gap-x-7 border-b border-border-subtle sm:flex-wrap">
          {controls.map((control) => {
            const isSelected = selectedCategoryId === control.id;

            return (
              <li key={control.id}>
                <button
                  aria-controls="faq-list"
                  aria-pressed={isSelected}
                  className={classNames(
                    "inline-flex min-h-12 items-center border-b-2 px-1 text-label font-semibold transition-colors motion-reduce:transition-none",
                    isSelected
                      ? "border-corporate-blue text-corporate-blue"
                      : "border-transparent text-text-secondary hover:border-border-control hover:text-corporate-blue",
                  )}
                  data-faq-category-control="true"
                  data-faq-category-id={control.id}
                  onClick={() => setSelectedCategoryId(control.id)}
                  type="button"
                >
                  {control.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p aria-live="polite" className="sr-only">
        {locale === "en" ? `${visibleEntries.length} questions shown.` : `${visibleEntries.length} soru gösteriliyor.`}
      </p>

      <div className="mt-10 space-y-5" data-faq-list="true" id="faq-list">
        {visibleEntries.map((entry, index) => {
          const category = categoriesById.get(entry.categoryId);

          if (!category) return null;

          return (
            <details
              className="group overflow-hidden rounded-card border border-border-subtle bg-surface-card"
              data-faq-category-id={category.id}
              data-faq-item="true"
              key={`${selectedCategoryId}-${entry.id}`}
              open={index === 0}
            >
              <summary className="flex min-h-28 cursor-pointer list-none items-center justify-between gap-5 px-5 py-6 marker:content-none md:px-8 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="inline-flex rounded-pill bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
                    {category.label}
                  </span>
                  <span className="mt-3 block text-heading-md font-semibold text-pretty text-text-primary">
                    {entry.question}
                  </span>
                </span>
                <svg
                  aria-hidden="true"
                  className="size-6 shrink-0 text-corporate-blue transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </summary>
              <div className="border-t border-border-subtle bg-surface-page px-5 py-6 md:px-8 md:py-8">
                <div className="max-w-4xl space-y-4 text-body-lg text-pretty text-text-secondary">
                  {entry.answerParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
