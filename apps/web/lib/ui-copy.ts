/** User-facing labels — plain language first; domain terms where the audience expects them. */

export const APP_TAGLINE =
  "ranked site queue · runbooks · end-of-shift handoff (demo data)";

export const APP_EPIGRAPH = "there are often multiple ways to open a locked door";

export const NAV = {
  console: { label: "shift", title: "Priority queue and site detail" },
  fleet: { label: "capacity", title: "Megawatts contracted vs available" },
  pipeline: { label: "deadlines", title: "Commissioning dates — bridge to permanent" },
  about: { label: "about", title: "What this demo does" },
} as const;

export const QUEUE = {
  title: "Priority queue",
  hint: "Sites sorted by risk score — highest first",
  mobile: "Site queue",
} as const;

export const FILTERS = {
  all: "All sites",
  exception: "Exception",
  watch: "Watch",
  overdue: "Past deadline",
  myTriage: "On my plate",
} as const;
