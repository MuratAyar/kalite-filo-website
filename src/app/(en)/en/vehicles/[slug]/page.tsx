import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/* eslint-disable @next/next/no-img-element -- approved local static-export vehicle media */

import { PageContainer, PageHeader, Section } from "@/components/layout";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import { englishVehiclePortfolio } from "@/data";
import { asInternalPath } from "@/lib";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

export const dynamicParams = false;
export function generateStaticParams() { return englishVehiclePortfolio.map((vehicle) => ({ slug: vehicle.slug })); }

function getVehicle(slug: string) { return englishVehiclePortfolio.find((vehicle) => vehicle.slug === slug); }

export async function generateMetadata({ params }: PageProps<"/en/vehicles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  if (!vehicle) return {};
  const englishPath = `/en/vehicles/${vehicle.slug}/`;
  const turkishPath = `/arac-listesi/${vehicle.slug}/`;
  return { title: `${vehicle.make} ${vehicle.model}`, description: vehicle.summary, alternates: { canonical: englishPath, languages: { en: englishPath, tr: turkishPath, "x-default": turkishPath } }, robots: createTranslatedRouteRobots("vehicle-detail") };
}

const priceFormatter = new Intl.NumberFormat("en-GB", { currency: "TRY", maximumFractionDigits: 0, style: "currency" });

export default async function EnglishVehicleDetailPage({ params }: PageProps<"/en/vehicles/[slug]">) {
  const vehicle = getVehicle((await params).slug);
  if (!vehicle) notFound();
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <PageHeader breadcrumbs={[{ href: asInternalPath("/en/", "English home"), label: "Home" }, { href: asInternalPath(ENGLISH_STATIC_PATHS.vehicles, "English vehicles"), label: "Vehicles" }, { label: `${vehicle.make} ${vehicle.model}` }]} breadcrumbsAriaLabel="Breadcrumb" intro={vehicle.trim} title={`${vehicle.make} ${vehicle.model}`} variant="high-emphasis" />
      <Section className="pt-6" surface="page"><PageContainer><div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <div>{vehicle.coverImage ? <figure><img alt={vehicle.coverImage.alt} className="w-full rounded-panel border border-border-subtle bg-surface-muted object-cover" height={vehicle.coverImage.height} src={vehicle.coverImage.src} width={vehicle.coverImage.width} /><figcaption className="mt-3 text-xs text-text-secondary">Representative model-family image; trim, equipment and colour may differ.</figcaption></figure> : <div className="grid aspect-[4/3] place-items-center rounded-panel bg-surface-muted text-text-secondary">Approved image pending</div>}<p className="mt-8 text-body-lg leading-relaxed text-text-secondary">{vehicle.summary}</p><h2 className="mt-10 text-heading-md font-semibold">Key Portfolio Details</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{vehicle.featureLabels.map((feature) => <li className="rounded-control border border-border-subtle bg-surface-card p-4" key={feature}>{feature}</li>)}</ul></div>
        <aside className="h-fit rounded-panel border border-border-subtle bg-surface-card p-6 shadow-sm lg:sticky lg:top-28"><h2 className="text-heading-md font-semibold">Vehicle Information</h2><dl className="mt-6 space-y-4">{[["Model year", vehicle.modelYearLabel], ["Category", vehicle.categoryLabel], ["Segment", vehicle.segmentLabel], ["Fuel", vehicle.fuelLabel], ["Transmission", vehicle.transmissionLabel], ["Power", vehicle.powerHp ? `${vehicle.powerHp} HP` : "Not specified"], ["Seats", vehicle.seats ? String(vehicle.seats) : "Not specified"]].map(([label, value]) => <div className="flex justify-between gap-4 border-b border-border-subtle pb-3" key={label}><dt className="text-text-secondary">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}</dl><p className="mt-6 text-2xl font-bold text-corporate-blue">{priceFormatter.format(vehicle.listPrice.amountMinor / 100)}</p><p className="mt-1 text-sm text-text-secondary">Monthly recommended list net price, excluding 20% VAT. This is not a binding quotation or availability guarantee.</p><Link className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accent-orange px-6 font-semibold text-brand-navy" href={`${ENGLISH_STATIC_PATHS.quote}?vehicle=${vehicle.slug}`}>Request a Quote <span aria-hidden="true" className="ml-2">→</span></Link></aside>
      </div></PageContainer></Section>
    </main>
  );
}
