import { PageContainer } from "@/components/layout/page-container";
import {
  BrandLink,
  MobileNavigation,
  PrimaryNavigation,
} from "@/components/navigation";
import { getActionClassName } from "@/components/ui/button-styles";
import {
  PRIMARY_NAVIGATION_ITEMS,
  QUOTE_NAVIGATION_ITEM,
} from "@/config/public-navigation";

/** Full-width public header with a static, content-pressure breakpoint. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface-card/95 shadow-[0_1px_0_rgb(24_33_54_/_0.04)] backdrop-blur-md">
      <PageContainer>
        <div className="flex min-h-16 min-w-0 items-center justify-between gap-6 lg:grid lg:min-h-20 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <BrandLink className="lg:justify-self-start" />
          <div className="hidden min-w-0 lg:contents">
            <PrimaryNavigation
              actionClassName={getActionClassName({
                size: "primary",
                variant: "primary",
              })}
              actionCurrentClassName="bg-orange-dark"
              actionItem={QUOTE_NAVIGATION_ITEM}
              className="justify-self-center"
              items={PRIMARY_NAVIGATION_ITEMS}
            />
          </div>
        </div>
        <MobileNavigation />
      </PageContainer>
    </header>
  );
}
