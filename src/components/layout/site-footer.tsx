import { PageContainer } from "@/components/layout/page-container";
import { BrandLink } from "@/components/navigation/brand-link";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import {
  FOOTER_NAVIGATION_ITEMS,
  type PublicNavigationItem,
} from "@/config/public-navigation";
import { contactInformation } from "@/data/site";

const QUICK_LINK_IDS = new Set([
  "vehicles",
  "fleet-guide",
  "faq",
  "quote",
]);

function selectFooterItems(
  routeIds: ReadonlySet<string>,
): readonly PublicNavigationItem[] {
  return FOOTER_NAVIGATION_ITEMS.filter((item) => routeIds.has(item.id));
}

const QUICK_LINK_ITEMS = selectFooterItems(QUICK_LINK_IDS);
const CORPORATE_ITEMS = selectFooterItems(
  new Set([
    "about",
    "privacy-security",
    "cookie-policy",
    "terms-of-use",
  ]),
);
const CONTACT_ITEMS = selectFooterItems(new Set(["contact"]));

const contactLinkClasses =
  "inline-flex min-h-11 min-w-0 items-center break-all rounded-sm py-2 text-body text-text-inverse-muted underline-offset-4 transition-colors hover:text-text-inverse hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-orange motion-reduce:transition-none";

function FooterNavigationGroup({
  ariaLabel,
  items,
  title,
}: {
  ariaLabel: string;
  items: readonly PublicNavigationItem[];
  title: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="mb-3 text-body font-semibold text-text-inverse">
        {title}
      </h2>
      <PrimaryNavigation
        ariaLabel={ariaLabel}
        className="[&_ul]:!grid-cols-1"
        items={items}
        orientation="footer"
      />
    </div>
  );
}

function FooterContactGroup() {
  return (
    <div className="min-w-0">
      <h2 className="mb-3 text-body font-semibold text-text-inverse">
        Bize Ulaşın
      </h2>
      <PrimaryNavigation
        ariaLabel="Alt bilgi iletişim bağlantıları"
        className="[&_ul]:!grid-cols-1"
        items={CONTACT_ITEMS}
        orientation="footer"
      />
      <address className="not-italic">
        <ul className="grid min-w-0">
          {contactInformation.phones.map((phone) => (
            <li className="min-w-0" key={phone.id}>
              <a
                aria-label={`${phone.label}: ${phone.displayValue}`}
                className={contactLinkClasses}
                href={phone.href}
              >
                {phone.displayValue}
              </a>
            </li>
          ))}
          {contactInformation.emails.map((email) => (
            <li className="min-w-0" key={email.id}>
              <a
                aria-label={`${email.label}: ${email.displayValue}`}
                className={contactLinkClasses}
                href={email.href}
              >
                {email.displayValue}
              </a>
            </li>
          ))}
        </ul>
      </address>
    </div>
  );
}

/** Public footer limited to verified brand and approved route decisions. */
export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-navy-secondary bg-brand-navy text-text-inverse">
      <PageContainer className="py-14 md:py-16 lg:py-20">
        <div className="grid min-w-0 grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-8 lg:grid-cols-[minmax(15rem,1.35fr)_repeat(3,minmax(0,0.65fr))] lg:items-start lg:gap-x-12">
          <div className="col-span-3 min-w-0 lg:col-span-1">
            <BrandLink tone="inverse" />
          </div>

          <FooterNavigationGroup
            ariaLabel="Alt bilgi hızlı bağlantıları"
            items={QUICK_LINK_ITEMS}
            title="Hızlı Linkler"
          />
          <FooterNavigationGroup
            ariaLabel="Alt bilgi kurumsal bağlantıları"
            items={CORPORATE_ITEMS}
            title="Kurumsal"
          />
          <FooterContactGroup />
        </div>
      </PageContainer>
    </footer>
  );
}
