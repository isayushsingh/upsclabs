// lib/orgs/types.ts
// Domain types for the International Organizations tool (GS2 · Polity &
// International Relations): pick one organization, its member countries
// light up on a single flat world map. Unlike the parks/world-map tools
// (India → state, continent → country), the unit here is global and the
// "shape" is real — pulled from world-atlas's Natural Earth borders — since
// the whole point of the tool is recognizing the actual country, not a
// placeholder rectangle.

/** How a country relates to an organization — rendered as distinct fill
    treatments so "observer" never gets mistaken for full membership. */
export type MembershipTier = "member" | "observer" | "dialogue-partner";

export interface Membership {
  /** ISO 3166-1 alpha-3, matching the `iso3` property baked into
      lib/orgs/world-50m.json at prep time. */
  iso3: string;
  tier: MembershipTier;
  /** Present at the organization's founding — a common exam angle
      ("which of these was NOT a founding member"). */
  founding?: boolean;
  /** Year of accession, when confidently known. */
  joined?: number;
  /** Short caveat for a membership that isn't a clean yes/no — suspensions,
      disputed accession, non-core partners, etc. */
  note?: string;
}

export type OrgCategory =
  | "Economic & Trade"
  | "Regional Blocs"
  | "Security & Strategic"
  | "South-South Cooperation"
  | "Export Control Regimes"
  | "Connectivity & Corridors";

export interface Organization {
  slug: string;
  name: string;
  fullName: string;
  category: OrgCategory;
  /** Legend / pill swatch + map highlight color. */
  color: string;
  founded: number;
  blurb: string;
  members: Membership[];
}
