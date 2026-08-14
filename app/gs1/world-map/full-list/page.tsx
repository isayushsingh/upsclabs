import ToolHeader from "@/components/site/ToolHeader";
import ToolPromoBanner from "@/components/site/ToolPromoBanner";
import ToolSummary, { ToolSummaryDetails } from "@/components/site/ToolSummary";
import { pageMetadata } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import continentsData from "@/lib/worldmap/continents.json";
import citiesData from "@/lib/worldmap/cities.json";
import mountainsData from "@/lib/worldmap/mountains.json";
import lakesData from "@/lib/worldmap/lakes.json";
import type { CitiesByCountry, PeaksByCountry, LakesByCountry } from "@/lib/worldmap/types";

const CONTINENTS = continentsData as { id: string; label: string; ready: boolean }[];
const CITIES = citiesData as unknown as Record<string, CitiesByCountry>;
const MOUNTAINS = mountainsData as unknown as Record<string, PeaksByCountry>;
const LAKES = lakesData as unknown as Record<string, LakesByCountry>;

const TITLE = "World Map: Cities, Mountains & Lakes — Full List";
const DESCRIPTION =
  "Capitals and major cities, notable mountains and volcanoes, and lakes, by continent and country — the reference list behind UPSC Labs' interactive world map.";
const PATH = "/gs1/world-map/full-list";
const TOOL = TOOLS.find((t) => t.href === "/gs1/world-map")!;

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  // Mirrors the parent tool page's noindex — see its own metadata comment.
  noindex: true,
});

export default function Page() {
  return (
    <>
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "World Map", href: "/gs1/world-map" },
          { label: "Full List" },
        ]}
        title="Cities, mountains & lakes — full list"
        subtitle="Plain-text reference behind the interactive world map."
      />
      <ToolPromoBanner tool={TOOL} />
      <ToolSummary
        title="By continent"
        intro="Capital/major cities, notable mountains & volcanoes, and lakes, by country. Open a continent for the full list."
      >
        {CONTINENTS.map((c) => {
          const cities = CITIES[c.id] ?? {};
          const mountains = MOUNTAINS[c.id] ?? {};
          const lakes = LAKES[c.id] ?? {};
          const countries = [
            ...new Set([...Object.keys(cities), ...Object.keys(mountains), ...Object.keys(lakes)]),
          ].sort();
          if (countries.length === 0) return null;
          return (
            <ToolSummaryDetails key={c.id} summary={`${c.label} (${countries.length} countries)`}>
              <table>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Cities</th>
                    <th>Mountains / volcanoes</th>
                    <th>Lakes</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country) => (
                    <tr key={country}>
                      <td>{country}</td>
                      <td>
                        {(cities[country] ?? [])
                          .map((city) => (city.capital ? `${city.name} (capital)` : city.name))
                          .join(", ") || "—"}
                      </td>
                      <td>{(mountains[country] ?? []).map((m) => m.name).join(", ") || "—"}</td>
                      <td>{(lakes[country] ?? []).map((l) => l.name).join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ToolSummaryDetails>
          );
        })}
      </ToolSummary>
    </>
  );
}
