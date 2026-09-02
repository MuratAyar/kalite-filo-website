import type { VehiclePortfolioRecord } from "@/types";

import { vehiclePortfolio } from "./vehicle-portfolio";

const categoryLabels: Record<string, string> = { Binek: "Passenger Car", SUV: "SUV", Ticari: "Commercial Vehicle" };
const fuelLabels: Record<string, string> = { Benzin: "Petrol", "Benzin / Hybrid": "Petrol / Hybrid", "Benzin / Mild Hybrid": "Petrol / Mild Hybrid", Dizel: "Diesel", Elektrik: "Electric", "Tam Hybrid": "Full Hybrid" };
const transmissionLabels: Record<string, string> = {
  "6 ileri Manuel": "6-Speed Manual", "7 ileri DCT": "7-Speed DCT", "7 ileri DSG": "7-Speed DSG", "7 ileri EDC Otomatik": "7-Speed EDC Automatic", "7DCT Otomatik": "7DCT Automatic", "8 ileri Otomatik": "8-Speed Automatic", "CVT Otomatik": "CVT Automatic", "DCT Otomatik": "DCT Automatic", "DSG Otomatik": "DSG Automatic", "e-CVT Otomatik": "e-CVT Automatic", "eDCS6 Otomatik": "eDCS6 Automatic", "e-DCT6 Otomatik": "e-DCT6 Automatic", "Multidrive S CVT": "Multidrive S CVT", "Otomatik / versiyona göre": "Automatic / Depending on Version", "Steptronic Otomatik": "Steptronic Automatic", "Tek oranlı otomatik": "Single-Speed Automatic", "X-Tronic Otomatik": "X-Tronic Automatic",
};
const segmentLabels: Record<string, string> = { "B/C-SUV Elektrik": "B/C-Segment Electric SUV", "Büyük Panelvan": "Large Panel Van", "Küçük Combi": "Compact Combi Van", "Küçük Panelvan": "Compact Panel Van", "Orta Panelvan": "Medium Panel Van", "D-SUV Elektrik": "D-Segment Electric SUV" };

const useCases: Record<string, string> = {
  "renault-clio-evolution-1-0-tce-x-tronic-90": "field teams, urban operations and cost-conscious executive pools",
  "hyundai-i20-1-0-t-gdi-90-7dct-jump": "urban field teams and operational fleets",
  "opel-corsa-hybrid-1-2-110-100-hp-e-dct6-edition": "urban company-car fleets focused on lower consumption",
  "fiat-egea-sedan-urban-1-6-m-jet-130-dct": "high-mileage field and sales teams",
  "skoda-kamiq-1-0-tsi-115-dsg-premium-fl": "executives and field teams requiring a compact SUV",
  "toyota-corolla-sedan-1-5-dream-x-pack-multidrive-s": "standard corporate saloon, sales and executive pools",
  "toyota-corolla-sedan-1-8-hybrid-dream-e-cvt-140": "corporate saloon fleets prioritising fuel and emissions optimisation",
  "renault-megane-sedan-touch-1-3-tce-edc-140": "mid-level executives, sales teams and long-distance use",
  "skoda-octavia-premium-1-5-tsi-mhev-150-dsg": "executive and long-distance fleets prioritising luggage capacity",
  "skoda-superb-prestige-1-5-tsi-mhev-150-dsg": "senior executives and long-distance corporate use",
  "hyundai-bayon-1-0-t-gdi-90-style-dct": "urban field teams requiring a compact crossover",
  "volkswagen-taigo-life-1-0-tsi-116-dsg": "executives and field teams seeking a design-led compact SUV",
  "opel-frontera-hybrid-1-2-145-e-dct6-edition": "team use and compact SUV fleets",
  "peugeot-2008-allure-hybrid-145-edcs6": "executive and field use focused on urban and ring-road driving",
  "renault-duster-turbo-tce-edc-145": "field work, construction-site surroundings and versatile corporate use",
  "nissan-qashqai-1-3-dig-t-mild-hybrid-158-x-tronic-designpack": "executive, family and long-distance C-SUV fleets",
  "peugeot-3008-allure-1-2-hybrid-145-edcs6": "mid-to-senior executives and family-style corporate SUV fleets",
  "volkswagen-t-roc-life-1-5-etsi-150-dsg": "executive and premium compact SUV fleets",
  "renault-austral-techno-mild-hybrid-150-auto": "executive C-SUV fleets with higher comfort expectations",
  "kia-sportage-1-6l-t-gdi-150-ps-dct": "executive and family-style corporate C-SUV fleets",
  "peugeot-408-allure-hybrid-145-edcs6": "mid-to-senior executive use prioritising design and presence",
  "tesla-model-y-rwd": "premium electric executive and technology-focused fleets",
  "kia-ev3-cool-long-range-150-kw": "electric corporate SUV fleets prioritising driving range",
  "bmw-320i-sedan-320i": "senior executive and representative use",
  "fiat-doblo-cargo-1-5-bluehdi-100-6mt": "service teams, technical crews, cargo work and urban distribution",
  "fiat-doblo-combi-1-5-bluehdi-130-at-easy": "personnel transport, field teams and versatile commercial use",
  "fiat-scudo-van-standard-business-l2-1-5-120": "medium-volume distribution, service and technical operations",
  "ford-tourneo-courier-1-0-ecoboost-125-7dct": "personnel, field teams and versatile urban use",
  "ford-transit-custom-van-2-0-ecoblue-136-320l-van-trend": "medium-volume corporate logistics, service and technical operations",
  "ford-transit-van-350m-9-5-m3-2-0-ecoblue-130-trend": "high-volume distribution, field service and logistics",
  "citroen-berlingo-van-1-5-bluehdi-100-6mt": "urban distribution, service and technical-team operations",
  "fiat-ducato-van-maxi-13-m3-2-2-multijet-140-6mt": "large-volume corporate distribution and logistics",
};

const legacyPhraseReplacements: readonly [RegExp, string][] = [
  [/bagaj/g, "luggage capacity"], [/yük hacmi/g, "cargo volume"], [/yükleme/g, "load volume"], [/ileri/g, "speed"], [/manuel/g, "manual"], [/otomatik/g, "automatic"], [/dizel/g, "diesel"], [/benzinli/g, "petrol"], [/Tam elektrikli/g, "Fully electric"], [/Düşük yakıt tüketimi/g, "Low fuel consumption"], [/Düşük tüketim/g, "Low consumption"], [/Düşük işletme maliyeti/g, "Low operating cost"], [/Geniş servis ağı/g, "Extensive service network"], [/Yaygın servis erişimi/g, "Broad service access"], [/Geniş iç mekan/g, "Spacious interior"], [/Geniş kabin/g, "Spacious cabin"], [/Geniş bagaj\/yük alanı/g, "Generous luggage/cargo area"], [/Kompakt şehir boyutu/g, "Compact urban dimensions"], [/Kompakt boyut/g, "Compact dimensions"], [/Kompakt ölçüler/g, "Compact dimensions"], [/Şehir içi kullanım/g, "Urban use"], [/Şehir içi verimlilik/g, "Urban efficiency"], [/Kurumsal/g, "Corporate"], [/Yönetici/g, "Executive"], [/kullanımına uygun/g, "use suitability"], [/kullanım odaklı/g, "use focused"], [/Gelişmiş sürüş destekleri/g, "Advanced driver assistance"], [/Yüksek oturma pozisyonu/g, "Elevated seating position"], [/Uzun yol ekonomisi/g, "Long-distance efficiency"], [/Uzun yol odaklı/g, "Long-distance focused"], [/Yaklaşık/g, "Approximately"], [/Çok amaçlı kullanım/g, "Versatile use"], [/Yazılım odaklı araç deneyimi/g, "Software-led vehicle experience"], [/Arkadan çekiş/g, "Rear-wheel drive"], [/Tek oranlı/g, "Single-speed"], [/koltuk/g, "seats"], [/nesil/g, "generation"], [/sistem gücü/g, "system output"], [/turbo/g, "turbo"], [/hybrid/g, "hybrid"], [/destek/g, "assistance"], [/tasarımı/g, "design"], [/pratikliği/g, "practicality"], [/sınıfı/g, "class"], [/gövde/g, "body"], [/kabin alanı/g, "cabin space"], [/konforu/g, "comfort"], [/donanım/g, "trim"], [/alternatifi/g, "alternative"], [/odaklı/g, "focused"], [/lojistik/g, "logistics"], [/operasyon/g, "operations"], [/şehir\/şehirler arası/g, "urban/intercity"],
];

const featureLabels: Readonly<Record<string, string>> = Object.freeze({
  "100 HP dizel": "100 HP diesel", "120 HP dizel": "120 HP diesel", "125 HP benzinli": "125 HP petrol", "130 HP dizel": "130 HP diesel",
  "13 m³ yük hacmi": "13 m³ cargo volume", "140 HP sistem gücü": "140 HP system output", "140 HP turbo": "140 HP turbo petrol",
  "145 HP hybrid": "145 HP hybrid system output", "145 HP turbo": "145 HP turbo petrol", "150 PS turbo": "150 PS turbo petrol",
  "3 kişilik kabin": "Three-seat cabin", "309 L bagaj": "309 L luggage capacity", "320L uzun gövde": "320L long-wheelbase body",
  "352 L bagaj": "352 L luggage capacity", "391 L bagaj": "391 L luggage capacity", "4.4 m³'e kadar yük hacmi": "Up to 4.4 m³ cargo volume",
  "4.6 L/100 km civarı WLTP": "Approximately 4.6 L/100 km WLTP", "400 L bagaj": "400 L luggage capacity", "411 L bagaj": "411 L luggage capacity",
  "434 L bagaj": "434 L luggage capacity", "438 L bagaj": "438 L luggage capacity", "460 L bagaj": "460 L luggage capacity",
  "471 L bagaj": "471 L luggage capacity", "480 L bagaj": "480 L luggage capacity", "5 koltuk": "Five seats",
  "5. nesil hybrid": "Fifth-generation hybrid system", "5.8 m³'e kadar yük hacmi": "Up to 5.8 m³ cargo volume",
  "503 L bagaj": "503 L luggage capacity", "504 L bagaj": "504 L luggage capacity", "520 L bagaj": "520 L luggage capacity",
  "527 L bagaj": "527 L luggage capacity", "536 L bagaj": "536 L luggage capacity", "591 L bagaj": "591 L luggage capacity",
  "6 ileri manuel": "6-speed manual", "600 L bagaj": "600 L luggage capacity", "625 L bagaj": "625 L luggage capacity",
  "7 ileri DCT": "7-speed DCT", "7 ileri DSG": "7-speed DSG", "7 ileri EDC": "7-speed EDC", "7DCT otomatik": "7DCT automatic",
  "8 ileri otomatik": "8-speed automatic", "9.5 m³ yük hacmi": "9.5 m³ cargo volume", "Arkadan çekiş": "Rear-wheel drive",
  "C sedan kabin alanı": "C-segment saloon cabin space", "C sedan konforu": "C-segment saloon comfort", "Coupé-SUV tasarımı": "Coupé-SUV design",
  "C-SUV gövde": "C-SUV body style", "C-SUV konforu": "C-SUV comfort", "C-SUV pratikliği": "C-SUV practicality", "C-SUV sınıfı": "C-SUV class", "C-SUV tasarımı": "C-SUV design",
  "CVT otomatik": "CVT automatic", "Çok amaçlı kullanım": "Versatile use", "D segment kabin alanı": "D-segment cabin space",
  "DCT otomatik": "DCT automatic", "DSG otomatik": "DSG automatic", "Düşük işletme maliyeti": "Low operating cost",
  "Düşük tüketim": "Low fuel consumption", "Düşük yakıt tüketimi": "Low fuel consumption", "EDC otomatik": "EDC automatic",
  "eDCS6 otomatik": "eDCS6 automatic", "e-DCT6 otomatik": "e-DCT6 automatic", "Fastback tasarım": "Fastback design",
  "Gelişmiş sürüş destekleri": "Advanced driver-assistance systems", "Geniş bagaj/yük alanı": "Generous luggage and cargo area",
  "Geniş iç mekan": "Spacious interior", "Geniş kabin": "Spacious cabin", "Geniş servis ağı": "Extensive service network",
  "Hacimli kurumsal taşımacılık": "High-volume corporate transport", "Kolay şehir içi kullanım": "Easy urban operation",
  "Kompakt boyut": "Compact dimensions", "Kompakt ölçüler": "Compact dimensions", "Kompakt şehir boyutu": "Compact urban dimensions",
  "Kompakt SUV ölçüsü": "Compact SUV dimensions", "Kurumsal filo standardı": "Corporate fleet standard",
  "Kurumsal kullanım odaklı": "Designed for corporate use", "Kurumsal saha kullanımına uygun": "Suitable for corporate field operations",
  "Kurumsal servis operasyonu": "Corporate service operations", "L2 orta panelvan": "L2 medium panel van",
  "Liftback pratikliği": "Liftback practicality", "Maxi panelvan": "Maxi panel van", "Mild hybrid destek": "Mild-hybrid assistance",
  "Otomatik şanzıman": "Automatic transmission", "Panelvan gövde": "Panel-van body", "Premium D sedan": "Premium D-segment saloon",
  "Premium filo alternatifi": "Premium fleet option", "Prestige donanım": "Prestige trim", "Şehir içi kullanım": "Urban use",
  "Şehir içi verimlilik": "Urban efficiency", "Şehir/şehirler arası lojistik": "Urban and intercity logistics", "Tam elektrikli": "Fully electric",
  "Techno donanım": "Techno trim", "Turbo benzinli": "Turbocharged petrol", "Turbo benzinli motor": "Turbocharged petrol engine",
  "Uzun yol ekonomisi": "Long-distance efficiency", "Uzun yol odaklı": "Designed for long-distance use",
  "Yaklaşık 3.3 m³ yükleme": "Approximately 3.3 m³ load volume", "Yaklaşık 6.8 m³ yük hacmi": "Approximately 6.8 m³ cargo volume",
  "Yaygın servis erişimi": "Broad service-network access", "Yazılım odaklı araç deneyimi": "Software-led vehicle experience",
  "Yeni nesil 3008": "New-generation 3008", "Yönetici kullanımına uygun": "Suitable for executive use", "Yönetici segmenti": "Executive segment",
  "Yönetici/temsil kullanımına uygun": "Suitable for executive and representative use", "Yüksek hacimli operasyon": "High-volume operations",
  "Yüksek oturma pozisyonu": "Elevated seating position", "Yüksek tavanlı pratik gövde": "Practical high-roof body", "Yüksek yerden yapı": "Raised ride height",
});

function translateFeature(value: string): string {
  return featureLabels[value] ?? legacyPhraseReplacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value);
}

export const englishVehiclePortfolio: readonly VehiclePortfolioRecord[] = Object.freeze(vehiclePortfolio.map((vehicle) => {
  const fuel = fuelLabels[vehicle.fuelLabel] ?? vehicle.fuelLabel;
  const transmission = transmissionLabels[vehicle.transmissionLabel] ?? vehicle.transmissionLabel;
  const fullName = `${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
  return Object.freeze({
    ...vehicle,
    categoryLabel: categoryLabels[vehicle.categoryLabel] ?? vehicle.categoryLabel,
    segmentLabel: segmentLabels[vehicle.segmentLabel] ?? vehicle.segmentLabel,
    fuelLabel: fuel,
    transmissionLabel: transmission,
    summary: `${fullName} is a corporate fleet option selected for ${useCases[vehicle.slug] ?? "business mobility requirements"}, combining ${fuel.toLowerCase()} power with a ${transmission.toLowerCase()} transmission.`,
    featureLabels: vehicle.featureLabels.map(translateFeature),
    coverImage: vehicle.coverImage ? Object.freeze({ ...vehicle.coverImage, purpose: "informative" as const, alt: `${vehicle.make} ${vehicle.model}, representative model-family image; trim and colour may differ` }) : undefined,
    galleryImages: vehicle.galleryImages ? Object.freeze(vehicle.galleryImages.map((image, index) => Object.freeze({ ...image, purpose: "informative" as const, alt: `${vehicle.make} ${vehicle.model}, image ${index + 1}` }))) : undefined,
    imageLicense: vehicle.imageLicense ? Object.freeze({ ...vehicle.imageLicense, localDerivativeNote: "A local 960-pixel derivative of the Wikimedia Commons file is used. The image represents the model family; trim and colour may differ." }) : undefined,
    imageLicenses: vehicle.imageLicenses ? Object.freeze(vehicle.imageLicenses.map((license) => Object.freeze({ ...license, localDerivativeNote: "A verified local vehicle image derivative is used." }))) : undefined,
  });
}));
