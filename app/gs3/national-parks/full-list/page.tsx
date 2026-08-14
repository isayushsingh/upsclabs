import ToolHeader from "@/components/site/ToolHeader";
import ToolPromoBanner from "@/components/site/ToolPromoBanner";
import ToolSummary, { ToolSummaryDetails } from "@/components/site/ToolSummary";
import { pageMetadata } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import parksData from "@/lib/parks/parks.json";
import reservesData from "@/lib/parks/reserves.json";
import wetlandsData from "@/lib/parks/wetlands.json";
import type { ParksByState, ReservesByState, WetlandsByState } from "@/lib/parks/types";

const PARKS = parksData as unknown as ParksByState;
const RESERVES = reservesData as unknown as ReservesByState;
const WETLANDS = wetlandsData as WetlandsByState;
const STATES = [...new Set([...Object.keys(PARKS), ...Object.keys(RESERVES)])].sort();

const TITLE = "National Parks & Tiger Reserves of India — Full List";
const DESCRIPTION =
  "Every national park, tiger reserve and wetland state-by-state — river systems, vegetation, key species and UPSC-relevant notes. The reference list behind UPSC Labs' interactive protected-areas map.";
const PATH = "/gs3/national-parks/full-list";
const TOOL = TOOLS.find((t) => t.href === "/gs3/national-parks")!;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default function Page() {
  return (
    <>
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS3", href: "/gs3" },
          { label: "National Parks", href: "/gs3/national-parks" },
          { label: "Full List" },
        ]}
        title="Parks, reserves & wetlands — full list"
        subtitle="Plain-text, state-by-state reference behind the interactive protected-areas map."
      />
      <ToolPromoBanner tool={TOOL} />
      <ToolSummary
        title="By state"
        intro="Open a state for its national parks, tiger reserves and wetland count, with key species and notes for each."
      >
        {STATES.map((state) => {
          const parks = PARKS[state] ?? [];
          const reserves = RESERVES[state] ?? [];
          const wetlandCount = (WETLANDS[state] ?? []).length;
          const count = parks.length + reserves.length;
          return (
            <ToolSummaryDetails
              key={state}
              summary={`${state} (${count} park${count === 1 ? "" : "s"}/reserve${count === 1 ? "" : "s"}${
                wetlandCount ? `, ${wetlandCount} wetland${wetlandCount === 1 ? "" : "s"}` : ""
              })`}
            >
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>River(s)</th>
                    <th>Key species</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {parks.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>{p.tr ? "National Park + Tiger Reserve" : "National Park"}</td>
                      <td>{p.river}</td>
                      <td>{p.species.map((s) => s[0]).join(", ")}</td>
                      <td>{p.note}</td>
                    </tr>
                  ))}
                  {reserves.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td>Tiger Reserve</td>
                      <td>—</td>
                      <td>{r.species.map((s) => s[0]).join(", ")}</td>
                      <td>{r.note}</td>
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
