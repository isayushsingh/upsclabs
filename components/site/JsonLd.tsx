// Renders a schema.org JSON-LD <script> tag from a plain object. Search
// engines parse this to power rich results (sitelinks, rich snippets) —
// it's invisible to visitors, but it's the machine-readable version of
// what a page's metadata already says in prose.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
