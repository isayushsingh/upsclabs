import ToolHeader from "@/components/site/ToolHeader";
import ToolPromoBanner from "@/components/site/ToolPromoBanner";
import ToolSummary, { ToolSummaryDetails } from "@/components/site/ToolSummary";
import { pageMetadata } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import { ORGANIZATIONS } from "@/lib/orgs/organizations";
import { COUNTRY_BY_ISO3 } from "@/lib/orgs/geo";

const TITLE = "International Organizations & Their Members — Full List";
const DESCRIPTION =
  "Every organization on UPSC Labs' international organizations map, with founding year and full member list — G7, G20, OECD, GCC, BIMSTEC and more.";
const PATH = "/gs2/international-organizations/full-list";
const TOOL = TOOLS.find((t) => t.href === "/gs2/international-organizations")!;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default function Page() {
  return (
    <>
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS2", href: "/gs2" },
          { label: "International Organizations", href: "/gs2/international-organizations" },
          { label: "Full List" },
        ]}
        title="Organizations & members — full list"
        subtitle="Plain-text reference behind the interactive organizations map."
      />
      <ToolPromoBanner tool={TOOL} />
      <ToolSummary
        title="By organization"
        intro="Membership facts as compiled in the tool's dataset — see each organization for tier (member/observer/dialogue partner) and founding-member notes where relevant."
      >
        {ORGANIZATIONS.map((org) => (
          <ToolSummaryDetails
            key={org.slug}
            summary={`${org.fullName} (${org.name}) — founded ${org.founded}, ${org.members.length} members`}
          >
            <p>{org.blurb}</p>
            <p>
              {org.members
                .map((m) => {
                  const name = COUNTRY_BY_ISO3.get(m.iso3)?.name ?? m.iso3;
                  const suffix =
                    m.tier === "observer"
                      ? " (observer)"
                      : m.tier === "dialogue-partner"
                        ? " (dialogue partner)"
                        : m.founding
                          ? " (founding member)"
                          : "";
                  return `${name}${suffix}`;
                })
                .join(", ")}
            </p>
          </ToolSummaryDetails>
        ))}
      </ToolSummary>
    </>
  );
}
