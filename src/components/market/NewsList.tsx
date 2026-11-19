import { fmtTime, useApi, type Meta, type NewsItem } from "../../lib/api";
import { DataBadge, ErrorNote, Skeleton } from "./bits";

/** Headlines from Yahoo Finance's news search, linked to the original publisher. Timestamps shown in IST. */
export default function NewsList({ q, count = 6 }: { q: string; count?: number }) {
  const { data, error, loading } = useApi<{ items: NewsItem[]; meta: Meta }>(`/api/news?q=${encodeURIComponent(q)}&count=${count}`, { maxAge: 10 * 60e3 });
  if (loading && !data) return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  return (
    <div>
      <ErrorNote error={error} />
      {data && data.items.length === 0 && <p className="text-sm text-muted">No recent headlines found.</p>}
      <ul className="divide-y divide-line">
        {data?.items.map((n) => (
          <li key={n.id}>
            <a href={n.link} target="_blank" rel="noreferrer" className="flex gap-3 py-3 group">
              {n.thumbnail && <img src={n.thumbnail} alt="" loading="lazy" className="w-20 h-14 rounded-lg object-cover shrink-0 bg-card" />}
              <span className="min-w-0">
                <span className="block font-medium leading-snug group-hover:text-cyan line-clamp-2">{n.title}</span>
                <span className="block text-xs text-muted mt-1">{n.publisher} · {fmtTime(n.time)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {data && <DataBadge meta={data.meta} kind="News" className="mt-2" />}
    </div>
  );
}
