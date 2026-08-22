import { Icon } from "@/components/ui";

export type AboutIconName =
  | "analytics"
  | "award"
  | "briefcase"
  | "calendar"
  | "dashboard"
  | "document"
  | "eye"
  | "flag"
  | "gauge"
  | "gavel"
  | "headset"
  | "leaf"
  | "lightbulb"
  | "rocket"
  | "route"
  | "shield"
  | "sliders"
  | "users"
  | "wallet"
  | "trend";

export function AboutIcon({ name }: { name: AboutIconName }) {
  return (
    <Icon className="size-6" decorative>
      {name === "analytics" ? (
        <>
          <path d="M4 18V9" />
          <path d="M10 18V5" />
          <path d="M16 18v-7" />
          <path d="M22 18V3" />
        </>
      ) : null}
      {name === "award" ? (
        <>
          <circle cx="12" cy="8" r="5" />
          <path d="m9 12-1 9 4-2 4 2-1-9" />
        </>
      ) : null}
      {name === "briefcase" ? (
        <>
          <rect height="13" rx="2" width="20" x="2" y="7" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M2 12h20" />
        </>
      ) : null}
      {name === "calendar" ? (
        <>
          <rect height="18" rx="2" width="18" x="3" y="4" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </>
      ) : null}
      {name === "dashboard" ? (
        <>
          <rect height="16" rx="2" width="20" x="2" y="4" />
          <path d="M7 15v-3M12 15V8M17 15v-5" />
        </>
      ) : null}
      {name === "document" ? (
        <>
          <path d="M6 2h9l3 3v17H6z" />
          <path d="M14 2v4h4M9 11h6M9 15h6" />
        </>
      ) : null}
      {name === "eye" ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      ) : null}
      {name === "flag" ? (
        <>
          <path d="M5 21V4" />
          <path d="M5 5h11l-2 4 2 4H5" />
        </>
      ) : null}
      {name === "gauge" ? (
        <>
          <path d="M4 15a8 8 0 1 1 16 0" />
          <path d="m12 15 4-4M7 19h10" />
        </>
      ) : null}
      {name === "gavel" ? (
        <>
          <path d="m14 5 5 5M12 7l5 5M4 20l7-7" />
          <rect height="5" rx="1" transform="rotate(-45 11 7)" width="9" x="6.5" y="4.5" />
        </>
      ) : null}
      {name === "headset" ? (
        <>
          <path d="M4 13a8 8 0 0 1 16 0" />
          <path d="M4 13v5h4v-6H4M20 13v5h-4v-6h4" />
          <path d="M16 20h-4" />
        </>
      ) : null}
      {name === "leaf" ? (
        <>
          <path d="M20 4C12 4 6 8 6 14a5 5 0 0 0 5 5c6 0 9-7 9-15Z" />
          <path d="M4 21c2-6 7-10 13-13" />
        </>
      ) : null}
      {name === "lightbulb" ? (
        <>
          <path d="M9 18h6M10 22h4" />
          <path d="M8 14a6 6 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z" />
        </>
      ) : null}
      {name === "rocket" ? (
        <>
          <path d="M14 5c3-3 6-3 6-3s0 3-3 6l-6 6-4-4 7-5Z" />
          <path d="m9 12-4 1-2 3 6-1M12 15l-1 4-3 2 1-6" />
          <circle cx="15" cy="7" r="1.5" />
        </>
      ) : null}
      {name === "route" ? (
        <>
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="6" r="2" />
          <path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3" />
        </>
      ) : null}
      {name === "sliders" ? (
        <>
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
        </>
      ) : null}
      {name === "shield" ? (
        <>
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : null}
      {name === "users" ? (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ) : null}
      {name === "wallet" ? (
        <>
          <path d="M4 5h14a2 2 0 0 1 2 2v12H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
          <path d="M16 11h6v4h-6a2 2 0 0 1 0-4Z" />
        </>
      ) : null}
      {name === "trend" ? (
        <>
          <path d="m4 17 6-6 4 4 6-8" />
          <path d="M16 7h4v4" />
        </>
      ) : null}
    </Icon>
  );
}
