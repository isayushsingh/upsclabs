import { notFound } from "next/navigation";
import Link from "next/link";
import { PYQS, getPyq } from "@/lib/pyq";
import { pageMetadata, pyqJsonLd } from "@/lib/seo";
import JsonLd from "@/components/site/JsonLd";
import ToolHeader from "@/components/site/ToolHeader";

export function generateStaticParams() {
  return PYQS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pyq = getPyq(slug);
  if (!pyq) return {};
  return pageMetadata({
    title: pyq.title,
    description: pyq.description,
    path: `/pyq/${pyq.slug}`,
  });
}

export default async function PyqPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pyq = getPyq(slug);
  if (!pyq) notFound();

  return (
    <>
      <JsonLd
        data={pyqJsonLd({ name: pyq.title, description: pyq.description, path: `/pyq/${pyq.slug}` })}
      />
      <main className="ul-main ul-pyq">
        <ToolHeader
          crumbs={[
            { label: "UPSC Labs", href: "/" },
            { label: "PYQ", href: "/pyq" },
            { label: `${pyq.examYear} Prelims` },
          ]}
          title={pyq.title}
          subtitle={`${pyq.examBody} ${pyq.examYear} — pair matching, worked on the map`}
        />

        <section className="ul-pyq-question">
          <div className="ul-pyq-question-label">The question</div>
          <p>{pyq.questionText}</p>
        </section>

        <section className="ul-pyq-pairs">
          {pyq.pairs.map((pair) => (
            <div className="ul-pyq-pair" key={pair.item}>
              <div className="ul-pyq-pair-head">
                <span className={`ul-pyq-verdict ${pair.correct ? "is-correct" : "is-wrong"}`}>
                  {pair.correct ? "Correct pair" : "Incorrect pair"}
                </span>
                <span className="ul-pyq-pair-title">
                  {pair.item} — {pair.claimedMatch}
                </span>
              </div>
              <p className="ul-pyq-pair-explain">{pair.explanation}</p>
              {pair.mapSlug && (
                <a
                  className="ul-pyq-pair-link"
                  href={`${pyq.tool.href}?highlight=${encodeURIComponent(pair.mapSlug)}`}
                >
                  See {pair.item} on the map ↗
                </a>
              )}
            </div>
          ))}
        </section>

        <section className="ul-pyq-answer">
          <strong>Answer:</strong> {pyq.answerNote}
        </section>

        <section className="ul-pyq-cta">
          <p>
            Explore every pair yourself on the{" "}
            <Link href={pyq.tool.href}>{pyq.tool.name}</Link> — switch to Recall mode once you've
            seen where each one actually sits.
          </p>
        </section>
      </main>
    </>
  );
}
