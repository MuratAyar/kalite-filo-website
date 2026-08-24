import { getActionClassName } from "@/components/ui/button-styles";
import { classNames } from "@/components/ui/class-names";
import {
  PRIMARY_NAVIGATION_ITEMS,
  QUOTE_NAVIGATION_ITEM,
} from "@/config/public-navigation";

import { PrimaryNavigation } from "./primary-navigation";

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
        "group border-t border-border-subtle pb-3 lg:hidden",
        className,
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-control px-3 py-2 text-label font-semibold text-text-primary hover:bg-surface-muted">
        <span>Menü</span>
        <span aria-hidden="true" className="text-xl leading-none text-corporate-blue">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="grid gap-3 pb-1 pt-2">
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
