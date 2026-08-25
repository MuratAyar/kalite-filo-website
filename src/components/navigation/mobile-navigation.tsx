import { getActionClassName } from "@/components/ui/button-styles";
import { classNames } from "@/components/ui/class-names";
import {
  PRIMARY_NAVIGATION_ITEMS,
  QUOTE_NAVIGATION_ITEM,
} from "@/config/public-navigation";

import { PrimaryNavigation } from "./primary-navigation";
import { CartCountBadge } from "./cart-count-badge";

export type MobileNavigationProps = {
  className?: string;
};

/**
 * A native, non-modal disclosure. Document navigation resets its open state
 * without a Client Component while retaining a complete no-JavaScript path.
 */
export function MobileNavigation({
  className,
}: MobileNavigationProps) {
  return (
    <details
      className={classNames(
        "group static shrink-0 lg:hidden",
        className,
      )}
    >
      <summary aria-label="Ana menüyü aç veya kapat" className="relative grid size-10 cursor-pointer list-none place-items-center rounded-control border border-border-subtle text-brand-navy transition-colors hover:border-corporate-blue hover:bg-surface-muted hover:text-corporate-blue motion-reduce:transition-none sm:size-11 [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" className="size-5 sm:size-6" fill="none" viewBox="0 0 24 24">
          <path className="group-open:hidden" d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          <path className="hidden group-open:block" d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
        <CartCountBadge variant="mobile-menu" />
      </summary>
      <div className="absolute inset-x-0 top-full z-50 grid gap-3 border-t border-border-subtle bg-surface-card px-gutter py-4 shadow-[0_1rem_2rem_rgb(24_33_54_/_0.12)]">
        <PrimaryNavigation
          actionClassName={getActionClassName({
            fullWidth: true,
            size: "primary",
            variant: "primary",
          })}
          actionCurrentClassName="bg-orange-dark"
          actionItem={QUOTE_NAVIGATION_ITEM}
          ariaLabel="Mobil ana menü"
          documentNavigation
          items={PRIMARY_NAVIGATION_ITEMS}
          orientation="vertical"
        />
      </div>
    </details>
  );
}
