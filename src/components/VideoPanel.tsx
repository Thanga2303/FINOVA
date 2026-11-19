import { useEffect, useState } from "react";
import { youtubeSearchUrl } from "../data";
import { toggle, useStore } from "../lib/store";
import { Icon } from "./ui";

type Video = { id: string; title: string; channel: string; description: string; thumbnail: string; duration: string; url: string; trusted: boolean };
type Resp = { source: "youtube" | "search"; searchUrl: string; videos: Video[]; note?: string };

const cache = new Map<string, Resp>();

/** YouTube API titles contain HTML entities (&#39;); decode them as plain text, never as HTML. */
const decode = (s: string) => new DOMParser().parseFromString(s, "text/html").documentElement.textContent ?? s;

/** Trusted creators we bias searches towards. These are real channels/organisations; we never invent specific video links. */
const PREFERRED = ["Zerodha Varsity", "SEBI", "NSE India", "NISM", "AMFI"];

export function useVideos(query: string) {
  const [data, setData] = useState<Resp | null>(cache.get(query) ?? null);
  const [loading, setLoading] = useState(!cache.has(query));
  useEffect(() => {
    if (cache.has(query)) { setData(cache.get(query)!); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    fetch(`/api/videos?q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: Resp) => { cache.set(query, j); if (alive) setData(j); })
      .catch(() => alive && setData({ source: "search", searchUrl: youtubeSearchUrl(query), videos: [] }))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [query]);
  return { data, loading };
}

export default function VideoPanel({ lessonId, title, query, compact }: { lessonId: string; title: string; query: string; compact?: boolean }) {
  const { data, loading } = useVideos(query);
  const [playing, setPlaying] = useState<string | null>(null);
  const saved = useStore((s) => s.savedVideos.includes(lessonId));
  const videos = data?.videos ?? [];

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-semibold"><Icon name="play" className="w-5 h-5 text-rose" /> Related video</div>
          <div className="text-xs text-muted">Topic: {title}</div>
        </div>
        <button className={`chip ${saved ? "!text-emerald !border-emerald/50" : ""}`} onClick={() => toggle("savedVideos", lessonId)} aria-pressed={saved}>
          <Icon name="bookmark" className="w-3.5 h-3.5" /> {saved ? "Saved" : "Save video topic"}
        </button>
      </div>

      {loading && <div className="h-40 rounded-2xl bg-card animate-pulse" />}

      {!loading && videos.length > 0 && (
        <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
          {videos.slice(0, compact ? 1 : 2).map((v) => (
            <article key={v.id} className="rounded-2xl border border-line overflow-hidden bg-card">
              <div className="relative aspect-video bg-black">
                {playing === v.id ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button className="absolute inset-0 group" onClick={() => setPlaying(v.id)} aria-label={`Play ${v.title}`}>
                    <img src={v.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                    <span className="absolute inset-0 grid place-items-center"><span className="rounded-full bg-black/60 p-3"><Icon name="play" className="w-8 h-8 text-white" /></span></span>
                    {v.duration && <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white rounded px-1.5 py-0.5">{v.duration}</span>}
                  </button>
                )}
              </div>
              <div className="p-4">
                <h4 className="font-semibold leading-snug line-clamp-2">{decode(v.title)}</h4>
                <div className="text-xs text-muted mt-1 flex items-center gap-2">
                  {v.channel} {v.trusted && <span className="chip !py-0 !text-emerald">Trusted source</span>}
                </div>
                {v.description && <p className="text-sm text-muted mt-2 line-clamp-2">{decode(v.description)}</p>}
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary !py-2 !px-4 text-sm" onClick={() => setPlaying(v.id)}>Watch now</button>
                  <a className="btn-ghost !py-2 !px-4 text-sm" href={v.url} target="_blank" rel="noreferrer">Open on YouTube</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">
            Find a beginner-friendly video on <span className="text-text font-medium">{title}</span> on YouTube. Look for lessons from trusted educators such as{" "}
            {PREFERRED.join(", ")}.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <a className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-2" href={data?.searchUrl ?? youtubeSearchUrl(query)} target="_blank" rel="noreferrer">
              <Icon name="play" className="w-4 h-4" /> Watch now on YouTube
            </a>
            <a className="btn-ghost !py-2 !px-4 text-sm" href={youtubeSearchUrl(`Zerodha Varsity ${title}`)} target="_blank" rel="noreferrer">Search Zerodha Varsity</a>
          </div>
          <p className="text-[11px] text-faint mt-3">
            Opens a YouTube search for this topic. Live video cards with thumbnails and durations appear here when the server has a YouTube Data API key.
          </p>
        </div>
      )}
    </div>
  );
}
