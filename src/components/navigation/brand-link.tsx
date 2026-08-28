import Link from "next/link";

import { classNames } from "@/components/ui/class-names";

export type BrandLinkProps = {
  className?: string;
  homeHref?: "/" | "/en/";
  tone?: "default" | "inverse";
};

/** Approved image wordmark on light surfaces; accessible text on navy. */
export function BrandLink({
  className,
  homeHref = "/",
  tone = "default",
}: BrandLinkProps) {
  const isInverse = tone === "inverse";

  return (
    <Link
      className={classNames(
        "inline-flex min-h-11 min-w-0 shrink-0 items-center rounded-sm",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        isInverse
          ? "text-text-inverse focus-visible:outline-accent-orange"
          : "text-corporate-blue focus-visible:outline-focus",
        className,
      )}
      href={homeHref}
    >
      {isInverse ? (
        <span className="text-heading-md font-bold tracking-tight">
          Kalite Filo
        </span>
      ) : (
        // Static export serves this approved, pre-sized local PNG directly.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt="Kalite Filo"
          className="h-auto w-32 sm:w-40 xl:w-44"
          height="112"
          src="/images/brand/kalite-filo-logo.png"
          width="560"
        />
      )}
    </Link>
  );
}
