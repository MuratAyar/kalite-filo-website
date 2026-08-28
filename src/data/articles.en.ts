import type { Article, ArticleCategory } from "@/types";
import { asEntityId, asSlug } from "@/lib";

import { articleCategories, articles } from "./articles";

const categoryCopy = {
  "uzun-donem-kiralama": ["long-term-leasing", "Long-Term Leasing"],
  "maliyet-ve-finans": ["cost-and-finance", "Cost and Finance"],
  "arac-rehberi": ["vehicle-guide", "Vehicle Guide"],
  "filo-yonetimi": ["fleet-management", "Fleet Management"],
  "elektrikli-araclar": ["electric-vehicles", "Electric Vehicles"],
  "bakim-ve-hasar": ["maintenance-and-damage", "Maintenance and Damage"],
} as const;

type EnglishArticleCopy = {
  slug: string; title: string; excerpt: string; alt?: string;
};

const articleCopy: Readonly<Record<string, EnglishArticleCopy>> = Object.freeze({
  "operasyonel-arac-kiralama-nedir": { slug: "what-is-operational-vehicle-leasing", title: "What Is Operational Vehicle Leasing? A Comprehensive Guide for Companies", excerpt: "Understand how long-term vehicle leasing works and how it can help companies manage cost, maintenance, operations and residual-value risk.", alt: "Aerial view of cars parked in organised rows" },
  "filo-toplam-sahip-olma-maliyeti-tco": { slug: "calculating-fleet-total-cost-of-ownership", title: "How to Calculate Fleet Costs: Seeing the True Cost with TCO", excerpt: "A company vehicle costs more than its purchase price or monthly rental. Explore every element that contributes to total cost of ownership.", alt: "Calculator, US dollar banknotes and a car key" },
  "kurumsal-filoda-dogru-arac-secimi": { slug: "how-to-choose-the-right-company-fleet-vehicle", title: "How to Choose the Right Vehicle for a Company Fleet", excerpt: "Compare saloons, SUVs and light commercial vehicles by duty, mileage, driver needs and total cost—not brand and price alone.", alt: "SUVs parked in a row" },
  "filo-kiralama-kilometre-limiti-nasil-belirlenir": { slug: "how-to-set-mileage-limits-for-fleet-leasing", title: "How to Set Mileage Limits for Fleet Leasing", excerpt: "Use real operating data instead of guesswork to set contract mileage and keep end-of-term costs under control.", alt: "Vehicle instrument cluster displaying 86,490 kilometres" },
  "elektrikli-araclar-sirket-filosu-gecis-rehberi": { slug: "electric-vehicles-for-company-fleets", title: "Do Electric Vehicles Make Sense for Company Fleets?", excerpt: "Assess daily routes, charging access, energy cost and operational requirements alongside vehicle price before electrifying a fleet.", alt: "White Tesla charging at a Supercharger station" },
  "filo-bakim-hasar-yonetimi": { slug: "fleet-maintenance-and-damage-management", title: "Fleet Maintenance and Damage Management: Keep Vehicles Working", excerpt: "Reduce vehicle downtime by planning scheduled maintenance, tyres, repairs and damage-handling processes as one operation.", alt: "Technician working on a car in a service workshop" },
  "uzun-donem-kiralama-sozlesmesinde-dikkat-edilecekler": { slug: "12-points-to-review-in-a-long-term-lease-agreement", title: "12 Points to Review in a Long-Term Vehicle Lease Agreement", excerpt: "Mileage, maintenance, tyres, damage, replacement vehicles, early termination and return conditions can matter as much as the monthly rental." },
  "satin-almak-mi-uzun-donem-kiralamak-mi": { slug: "buy-or-long-term-lease-company-vehicles", title: "Buy or Long-Term Lease Company Vehicles? A Decision Guide", excerpt: "Compare ownership and long-term leasing through capital use, operational workload, risk, flexibility and total cost." },
  "filo-butcesi-nasil-hazirlanir": { slug: "how-to-prepare-a-12-month-fleet-budget", title: "How to Prepare a Fleet Budget: A 12-Month Planning Guide", excerpt: "Build a realistic budget that covers fuel, maintenance, tyres, damage, replacement mobility, administration and contingencies—not rentals alone." },
  "filo-butcesinde-gizli-maliyetler": { slug: "eight-hidden-costs-in-a-fleet-budget", title: "Eight Hidden Costs in a Fleet Budget", excerpt: "Downtime, excess mileage, driver behaviour and management time can quietly increase fleet cost even when they do not appear as a single invoice line." },
  "sedan-suv-hafif-ticari-hangi-arac": { slug: "sedan-suv-or-light-commercial-vehicle-for-a-company-fleet", title: "Saloon, SUV or Light Commercial Vehicle? Choosing for a Company Fleet", excerpt: "Match each vehicle type to the role, route, load requirement, employee profile and total cost instead of applying one standard across the fleet." },
  "yuksek-kilometre-icin-sirket-araci-secimi": { slug: "vehicle-selection-for-high-mileage-businesses", title: "Choosing Company Vehicles for High-Mileage Operations", excerpt: "At 40,000–50,000 kilometres a year or more, small differences in efficiency, comfort and serviceability can produce significant business effects." },
  "kurumsal-filo-politikasi-nasil-hazirlanir": { slug: "how-to-create-a-corporate-fleet-policy", title: "How to Create a Corporate Fleet Policy", excerpt: "Define vehicle eligibility, authorised use, fuel, maintenance, incident reporting and responsibilities in a clear, workable governance framework." },
  "telematik-ve-surucu-davranisi-filo-verimliligi": { slug: "improving-fleet-efficiency-with-telematics", title: "Improving Fleet Efficiency with Telematics and Driver Behaviour", excerpt: "Turn mileage, route, idling and driving data into better decisions on fuel, maintenance, utilisation and safety." },
  "elektrikli-filo-sarj-altyapisi-planlama": { slug: "planning-charging-infrastructure-for-an-electric-fleet", title: "How to Plan Charging Infrastructure for a Company Fleet", excerpt: "Calculate daily energy demand and vehicle dwell time before deciding how many chargers an electric fleet requires." },
  "elektrikli-hibrit-icten-yanmali-filo-karsilastirmasi": { slug: "electric-hybrid-or-combustion-fleet-vehicles", title: "Electric, Hybrid or Combustion: Which Is Right for a Company Fleet?", excerpt: "Compare powertrain technologies by operating scenario; one solution may not be appropriate for every vehicle and route in the fleet." },
  "kaza-sonrasi-filo-hasar-yonetimi": { slug: "post-accident-damage-management-for-company-vehicles", title: "Post-Accident Damage Management for Company Vehicles", excerpt: "Standardise the journey from the first minutes after an incident to the vehicle's return to service to support safety and operational continuity." },
  "filo-lastik-yonetimi-rehberi": { slug: "fleet-tyre-management-guide", title: "Fleet Tyre Management: Safety, Cost and Operations", excerpt: "Manage tyres as a safety and efficiency system with direct effects on energy use, driving comfort and vehicle downtime." },
});

export const englishArticleCategories: readonly ArticleCategory[] = Object.freeze(articleCategories.map((category) => {
  const copy = categoryCopy[category.slug as keyof typeof categoryCopy];
  if (!copy) throw new Error(`Missing English category copy: ${category.slug}`);
  return Object.freeze({ ...category, id: asEntityId(copy[0]), slug: asSlug(copy[0]), label: copy[1] });
}));

export const englishArticles: readonly Article[] = Object.freeze(articles.map((article) => {
  const copy = articleCopy[article.slug];
  const sourceCategory = articleCategories.find((category) => category.id === article.categoryId);
  if (!copy || !sourceCategory) throw new Error(`Missing English article copy: ${article.slug}`);
  const translatedCategory = categoryCopy[sourceCategory.slug as keyof typeof categoryCopy];
  return Object.freeze({
    ...article,
    id: asEntityId(copy.slug), slug: asSlug(copy.slug), categoryId: asEntityId(translatedCategory[0]),
    title: copy.title, excerpt: copy.excerpt, contentKey: asEntityId(`${copy.slug}-en`),
    coverImage: article.coverImage ? Object.freeze({ ...article.coverImage, purpose: "informative" as const, alt: copy.alt ?? `${copy.title} cover image` }) : undefined,
    seo: Object.freeze({ title: `${copy.title} | Kalite Filo`, description: copy.excerpt }),
  });
}));
