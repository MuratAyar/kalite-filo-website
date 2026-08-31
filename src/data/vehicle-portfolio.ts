import portfolioRecords from "./vehicle-portfolio.json";
import priceSource from "./vehicle-list-prices.json";
import featuredVehicleIdsSource from "./featured-vehicle-ids.json";

import type {
  EntityId,
  HttpsUrl,
  LocalAssetPath,
  MediaAsset,
  Slug,
  VehicleImageLicense,
  VehiclePortfolioListPrice,
  VehiclePortfolioRecord,
} from "@/types";

type PortfolioRecordSource = Omit<
  VehiclePortfolioRecord,
  "coverImage" | "id" | "imageLicense" | "listPrice" | "slug"
> & {
  readonly id: string;
  readonly slug: string;
};

type PriceSourceId = keyof typeof priceSource.amountsMinor;

const featuredVehicleIds = featuredVehicleIdsSource as readonly string[];
if (featuredVehicleIds.length !== 4 || new Set(featuredVehicleIds).size !== 4) {
  throw new Error("The featured vehicle ordering contract requires exactly four unique ids.");
}
const featuredOrderById = new Map(featuredVehicleIds.map((id, index) => [id, index + 1]));

function createListPrice(sourceId: string): VehiclePortfolioListPrice {
  const amountMinor = priceSource.amountsMinor[sourceId as PriceSourceId];

  if (!amountMinor) {
    throw new Error(`Vehicle portfolio ${sourceId} is missing its approved list price.`);
  }

  return Object.freeze({
    amountMinor,
    currency: "TRY",
    billingPeriod: "month",
    vatTreatment: "excluded",
    sourceKind: "recommended-list-net",
  });
}

type FeaturedMedia = {
  readonly image: MediaAsset;
  readonly license: VehicleImageLicense;
};

type PortfolioMediaInput = {
  readonly fileName: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly creator: string;
  readonly sourcePage: string;
  readonly licenseName: string;
  readonly licenseUrl: string;
  readonly localDerivativeNote?: string;
};

function createPortfolioMedia(input: PortfolioMediaInput): FeaturedMedia {
  return Object.freeze({
    image: Object.freeze({
      purpose: "informative",
      src: `/images/vehicles/${input.fileName}` as LocalAssetPath,
      width: input.width,
      height: input.height,
      alt: input.alt,
    }),
    license: Object.freeze({
      creator: input.creator,
      sourcePage: input.sourcePage as HttpsUrl,
      licenseName: input.licenseName,
      licenseUrl: input.licenseUrl as HttpsUrl,
      localDerivativeNote:
        input.localDerivativeNote ??
        "Wikimedia Commons'taki dosyanın 960 piksel genişliğindeki türevi yerelleştirildi; görsel model ailesini temsil eder, donanım ve renk farklı olabilir.",
    }),
  });
}

/**
 * Owner-supplied workbook candidates promoted only after a Commons API licence
 * check and a visual model/body-style review. These are representative model-
 * family photographs, not claims about exact trim, colour or availability.
 * KF-015, KF-026, KF-030 and KF-031 deliberately remain without media because
 * their supplied candidates materially mismatched brand or body style.
 */
const portfolioMedia: Readonly<Record<string, FeaturedMedia>> = Object.freeze({
  "kf-001": createPortfolioMedia({
    fileName: "renault-clio.jpg",
    width: 960,
    height: 494,
    alt: "Gri Renault Clio V hatchback; donanım ve renk temsilidir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Renault_Clio_V_(2023)_1X7A1577.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-002": createPortfolioMedia({
    fileName: "hyundai-i20.jpg",
    width: 960,
    height: 496,
    alt: "Beyaz Hyundai i20 hatchback; donanım ve renk temsilidir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Hyundai_i20_(BC3)_Facelift_IMG_8591.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-003": createPortfolioMedia({
    fileName: "opel-corsa.jpg",
    width: 960,
    height: 604,
    alt: "Opel Corsa Hybrid model ailesini temsil eden hatchback; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:2023_Opel_Corsa_F_Hybrid_IMG_8487.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-004": createPortfolioMedia({
    fileName: "fiat-egea-tipo-sedan.jpg",
    width: 960,
    height: 585,
    alt: "Beyaz Fiat Tipo sedan; Türkiye'deki Egea Sedan ile aynı gövde ailesi, donanım ve renk temsilidir",
    creator: "Dennis Elzinga",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Fiat_Tipo_1.4_Sedan_(49182414416).jpg",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    localDerivativeNote:
      "Commons'taki kırpılmış ve plakası bulanıklaştırılmış güncel dosyanın 960 piksel türevi yerelleştirildi; Tipo/Egea gövde ailesini temsil eder.",
  }),
  "kf-005": createPortfolioMedia({
    fileName: "skoda-kamiq.jpg",
    width: 960,
    height: 600,
    alt: "Škoda Kamiq model ailesini temsil eden SUV; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:%C5%A0koda_Kamiq_Facelift_IMG_8638.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-006": createPortfolioMedia({
    fileName: "toyota-corolla-sedan.jpg",
    width: 960,
    height: 480,
    alt: "Toyota Corolla Sedan E210 model ailesini temsil eden otomobil; Çin pazarı donanımı ve renk farklı olabilir",
    creator: "Dinkun Chen",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:TOYOTA_COROLLA_SEDAN_(E210)_China_(9).jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-007": createPortfolioMedia({
    fileName: "toyota-corolla-hybrid-sedan.jpg",
    width: 960,
    height: 540,
    alt: "Toyota Corolla Hybrid Sedan model ailesini temsil eden otomobil; donanım ve renk farklı olabilir",
    creator: "Matti Blume",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Toyota_Corolla_Hybrid_Sedan,_GIMS_2019,_Le_Grand-Saconnex_(GIMS1338).jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-008": createPortfolioMedia({
    fileName: "renault-megane-sedan.jpg",
    width: 960,
    height: 525,
    alt: "Renault Megane Sedan model ailesini temsil eden otomobil; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Renault_Megane_IV_Sedan_1X7A0227.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-009": createPortfolioMedia({
    fileName: "skoda-octavia.jpg",
    width: 960,
    height: 508,
    alt: "Škoda Octavia liftback model ailesini temsil eden otomobil; donanım ve renk farklı olabilir",
    creator: "Mike-fiesta",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Skoda_Octavia_IV_liftback_(cropped).jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-010": createPortfolioMedia({
    fileName: "skoda-superb.jpg",
    width: 960,
    height: 437,
    alt: "Škoda Superb IV model ailesini temsil eden otomobil; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:%C5%A0koda_Superb_IV.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-011": createPortfolioMedia({
    fileName: "hyundai-bayon.jpg",
    width: 960,
    height: 510,
    alt: "Hyundai Bayon facelift model ailesini temsil eden SUV; donanım ve renk farklı olabilir",
    creator: "M 93",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Hyundai_Bayon_1.0_T-GDI_Prime_(Facelift)_%E2%80%93_f_07072024.jpg",
    licenseName: "CC BY-SA 3.0 DE",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/de/deed.en",
  }),
  "kf-012": createPortfolioMedia({
    fileName: "volkswagen-taigo.jpg",
    width: 960,
    height: 577,
    alt: "Volkswagen Taigo Life model ailesini temsil eden SUV; güç, donanım ve renk farklı olabilir",
    creator: "Harvey Bold",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:2023_Volkswagen_Taigo_Life_TSI_-_999cc_1.0_(110PS)_Petrol_-_Ascot_Grey_-_05-2024,_Front.jpg",
    licenseName: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  }),
  "kf-013": createPortfolioMedia({
    fileName: "opel-frontera.jpg",
    width: 960,
    height: 720,
    alt: "Opel Frontera 2024 model ailesini temsil eden SUV; donanım ve renk farklı olabilir",
    creator: "LudegoEV",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Opel_Frontera_2024.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-014": createPortfolioMedia({
    fileName: "peugeot-2008.jpg",
    width: 960,
    height: 540,
    alt: "Peugeot 2008 Allure model ailesini temsil eden SUV; fotoğraftaki PureTech motor ve renk temsilidir",
    creator: "MoCars",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:2024_Peugeot_2008_PureTech_130_Allure_(Front).jpg",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
  }),
  "kf-016": createPortfolioMedia({
    fileName: "nissan-qashqai.jpg",
    width: 960,
    height: 589,
    alt: "Nissan Qashqai J12 model ailesini temsil eden SUV; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:2024_Nissan_Qashqai_(J12)_IMG_1142.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-017": createPortfolioMedia({
    fileName: "peugeot-3008.jpg",
    width: 960,
    height: 416,
    alt: "Peugeot 3008 model ailesini temsil eden SUV; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Peugeot_3008_C_IMG_9394.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-018": createPortfolioMedia({
    fileName: "volkswagen-t-roc.jpg",
    width: 960,
    height: 547,
    alt: "Volkswagen T-Roc II model ailesini temsil eden fuar aracı; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Volkswagen_T-Roc_II_IAA_2025_DSC_2028.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-019": createPortfolioMedia({
    fileName: "renault-austral.jpg",
    width: 960,
    height: 640,
    alt: "Renault Austral facelift model ailesini temsil eden SUV; donanım ve renk farklı olabilir",
    creator: "Mark Neobach",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Renault_Austral_facelift_Wit_Bochane.jpg",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
  }),
  "kf-020": createPortfolioMedia({
    fileName: "kia-sportage.jpg",
    width: 960,
    height: 633,
    alt: "Kia Sportage NQ5 facelift model ailesini temsil eden SUV; Kore pazarı donanımı ve renk farklı olabilir",
    creator: "Damian B Oh",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Kia_Sportage_1.6T_2WD_Signature_NQ5_PE_Snow_White_Pearl_(3)_(cropped).jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-021": createPortfolioMedia({
    fileName: "peugeot-408.jpg",
    width: 960,
    height: 649,
    alt: "Peugeot 408 model ailesini temsil eden otomobil; donanım, motor ve renk farklı olabilir",
    creator: "Charles from Port Chester, New York",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Peugeot_408_(2024)_(53971759965).jpg",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  }),
  "kf-022": createPortfolioMedia({
    fileName: "tesla-model-y.jpg",
    width: 960,
    height: 720,
    alt: "Tesla Model Y Juniper RWD model ailesini temsil eden otomobil; batarya alt varyantı ve renk farklı olabilir",
    creator: "Chanokchon",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:2025_Tesla_Model_Y_Juniper_Long_Range_RWD.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-023": createPortfolioMedia({
    fileName: "kia-ev3.jpg",
    width: 960,
    height: 639,
    alt: "Kia EV3 model ailesini temsil eden GT-Line fuar aracı; Cool donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Kia_EV3_GT-Line_Automesse_Ludwigsburg_2024_IMG_1353.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-024": createPortfolioMedia({
    fileName: "bmw-320i-sedan.jpg",
    width: 960,
    height: 720,
    alt: "BMW G20 320i Sedan model ailesini temsil eden otomobil; donanım ve renk farklı olabilir",
    creator: "Damian B Oh",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:BMW_G20_320i_Luxury_Line_Alpine_White_(3).jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-025": createPortfolioMedia({
    fileName: "fiat-doblo-cargo.jpg",
    width: 960,
    height: 681,
    alt: "Fiat Doblò Mk3 Cargo model ailesini temsil eden panelvan; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:2024_Fiat_Dobl%C3%B2_Mk3_IMG_2388.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-027": createPortfolioMedia({
    fileName: "fiat-scudo-van.jpg",
    width: 960,
    height: 642,
    alt: "Fiat Scudo 2024 model ailesini temsil eden panelvan; gövde uzunluğu, donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Fiat_Scudo_(2024)_DSC_8323.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-028": createPortfolioMedia({
    fileName: "ford-tourneo-courier.jpg",
    width: 960,
    height: 604,
    alt: "Ford Tourneo Courier ikinci nesil model ailesini temsil eden araç; donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Ford_Tourneo_Courier_(2nd_generation)_IMG_9660.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
  "kf-029": createPortfolioMedia({
    fileName: "ford-transit-custom-van.jpg",
    width: 960,
    height: 549,
    alt: "Ford Transit Custom 2.0 EcoBlue model ailesini temsil eden panelvan; Limited donanım ve renk farklı olabilir",
    creator: "Harvey Bold",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:2024_Ford_Transit_Custom_Limited_TDCi_-_1996cc_2.0_(136PS)_Diesel_-_Artisan_Red_-_08-2024,_Front.jpg",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
  }),
  "kf-032": createPortfolioMedia({
    fileName: "fiat-ducato-van.jpg",
    width: 960,
    height: 612,
    alt: "Fiat Ducato 2024 model ailesini temsil eden panelvan; gövde hacmi, donanım ve renk farklı olabilir",
    creator: "Alexander Migl",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:2024_Fiat_Ducato_DSC_7199.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  }),
});

export const vehiclePortfolio: readonly VehiclePortfolioRecord[] = Object.freeze(
  (portfolioRecords as readonly PortfolioRecordSource[]).map((record) => {
    const media = portfolioMedia[record.id];
    const featuredOrder = featuredOrderById.get(record.id);

    return Object.freeze({
      ...record,
      id: record.id as EntityId,
      slug: record.slug as Slug,
      priceStatus: "owner-approved-list-net",
      featured: featuredOrder !== undefined,
      ...(featuredOrder !== undefined ? { featuredOrder } : {}),
      listPrice: createListPrice(record.sourceId),
      featureLabels: Object.freeze([...record.featureLabels]),
      ...(media
        ? { coverImage: media.image, imageLicense: media.license }
        : {}),
    });
  }),
);

if (featuredVehicleIds.some((id) => !vehiclePortfolio.some((vehicle) => vehicle.id === id))) {
  throw new Error("The featured vehicle ordering contract references an unknown vehicle id.");
}
