import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Icon } from "@/components/ui";

export type HomeIconName =
  | "archive"
  | "calendar"
  | "car"
  | "clipboard"
  | "compass"
  | "settings"
  | "truck";

const iconPaths: Readonly<Record<HomeIconName, ReactNode>> = {
  archive: (
    <>
      <path d="M4 5h16v4H4z" />
      <path d="M6 9v10h12V9" />
      <path d="M9 13h6" />
    </>
  ),
  calendar: (
    <>
      <rect height="16" rx="2" width="18" x="3" y="5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  car: (
    <>
      <path d="m5 11 2-5h10l2 5" />
      <path d="M3 12h18v6H3z" />
      <path d="M6 18v2M18 18v2M7 15h.01M17 15h.01" />
    </>
  ),
  clipboard: (
    <>
      <rect height="18" rx="2" width="14" x="5" y="4" />
      <path d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
};

export type HomeIconProps = Omit<
  ComponentPropsWithoutRef<typeof Icon>,
  "children" | "decorative" | "label"
> & {
  name: HomeIconName;
};

/** Decorative, project-owned line icons whose adjacent text carries meaning. */
export function HomeIcon({ name, ...props }: HomeIconProps) {
  return (
    <Icon decorative {...props}>
      {iconPaths[name]}
    </Icon>
  );
}
