import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

/** Tiny, safe markdown renderer for chat replies: **bold**, _italic_, [links](url), "- " bullets, numbered lines. No raw HTML. */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${key}-${i++}`} className="text-text">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("_")) out.push(<em key={`${key}-${i++}`}>{tok.slice(1, -1)}</em>);
    else {
      const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)]+)\)/)!;
      if (href.startsWith("/")) out.push(<Link key={`${key}-${i++}`} to={href} className="text-cyan underline underline-offset-2">{label}</Link>);
      else if (/^https:\/\//.test(href)) out.push(<a key={`${key}-${i++}`} href={href} target="_blank" rel="noreferrer" className="text-cyan underline underline-offset-2">{label}</a>);
      else out.push(label);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((b, bi) => {
        const lines = b.split("\n");
        const bullets = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        if (bullets) {
          return (
            <ul key={bi} className="list-disc pl-5 space-y-1">
              {lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-*•]\s+/, ""), `${bi}-${li}`)}</li>)}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {/^\s*#{1,4}\s/.test(l) ? <strong className="text-text">{l.replace(/^\s*#{1,4}\s/, "")}</strong> : inline(l.replace(/^\s*[-*•]\s+/, "• "), `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
