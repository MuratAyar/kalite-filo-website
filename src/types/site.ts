import type { MediaAsset } from "./media";
import type {
  EmailUrl,
  HttpsUrl,
  TelephoneUrl,
} from "./primitives";

export interface SiteIdentity {
  readonly brandName: string;
  readonly defaultTitle: string;
  readonly titleTemplate?: string;
  readonly defaultDescription?: string;
  readonly legalName?: string;
  readonly logo?: MediaAsset;
  readonly icons?: readonly MediaAsset[];
}

export interface PhoneContact {
  readonly id: string;
  readonly label: string;
  readonly displayValue: string;
  readonly href: TelephoneUrl;
}

export interface EmailContact {
  readonly id: string;
  readonly label: string;
  readonly displayValue: string;
  readonly href: EmailUrl;
}

export interface PostalAddress {
  readonly lines: readonly string[];
  readonly district?: string;
  readonly province: string;
  readonly postalCode?: string;
  readonly countryCode: string;
}

export interface SocialLink {
  readonly id: string;
  readonly label: string;
  readonly href: HttpsUrl;
}

export interface ContactInformation {
  readonly phones: readonly PhoneContact[];
  readonly emails: readonly EmailContact[];
  readonly address?: PostalAddress;
  readonly businessHours?: readonly string[];
  readonly mapUrl?: HttpsUrl;
  readonly socialLinks?: readonly SocialLink[];
}

