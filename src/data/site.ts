import type { ContactInformation, NavigationItem, SiteIdentity } from "@/types";
import { asEntityId } from "@/lib/validation";

export const siteIdentity: SiteIdentity | null = null;

/** Contact channels explicitly supplied and approved by the project owner. */
export const contactInformation: ContactInformation = Object.freeze({
  phones: Object.freeze([
    Object.freeze({
      id: asEntityId("main-phone", "phone contact id"),
      label: "Telefon",
      displayValue: "05317158068",
      href: "tel:+905317158068",
    }),
  ]),
  emails: Object.freeze([
    Object.freeze({
      id: asEntityId("main-email", "email contact id"),
      label: "E-posta",
      displayValue: "info@kalitefilo.com.tr",
      href: "mailto:info@kalitefilo.com.tr",
    }),
  ]),
});
export const navigationItems: readonly NavigationItem[] = Object.freeze([]);
