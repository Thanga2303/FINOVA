// Educational video search. Uses the YouTube Data API when YOUTUBE_API_KEY is set; otherwise returns a YouTube search link.
import { cached } from "./cache.js";

const YT_KEY = process.env.YOUTUBE_API_KEY?.trim();
const TRUSTED = ["zerodha varsity", "zerodha", "sebi", "nse india", "nseindia", "bse india", "nism", "amfi", "mutual funds sahi hai"];
export const youtubeEnabled = () => Boolean(YT_KEY);

function isoDuration(d = "") {
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const [h, mi, s] = [m[1], m[2], m[3]].map((x) => Number(x || 0));
  return h ? `${h}:${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${mi}:${String(s).padStart(2, "0")}`;
}

export async function videos(q) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  if (!YT_KEY) return { source: "search", searchUrl, videos: [] };
  try {
    return await cached(`yt:${q}`, 24 * 3600e3, async () => {
      const s = new URL("https://www.googleapis.com/youtube/v3/search");
      Object.entries({ part: "snippet", type: "video", q, maxResults: "8", safeSearch: "strict", relevanceLanguage: "en", regionCode: "IN", videoEmbeddable: "true", key: YT_KEY }).forEach(([k, v]) => s.searchParams.set(k, v));
      const sj = await fetch(s, { signal: AbortSignal.timeout(10000) }).then((r) => { if (!r.ok) throw new Error(`search ${r.status}`); return r.json(); });
      const ids = (sj.items || []).map((i) => i.id?.videoId).filter(Boolean);
      if (!ids.length) return { source: "search", searchUrl, videos: [] };
      const v = new URL("https://www.googleapis.com/youtube/v3/videos");
      Object.entries({ part: "snippet,contentDetails", id: ids.join(","), key: YT_KEY }).forEach(([k, val]) => v.searchParams.set(k, val));
      const vj = await fetch(v, { signal: AbortSignal.timeout(10000) }).then((r) => { if (!r.ok) throw new Error(`videos ${r.status}`); return r.json(); });
      const list = (vj.items || []).map((it) => ({
        id: it.id, title: it.snippet.title, channel: it.snippet.channelTitle,
        description: (it.snippet.description || "").split("\n")[0].slice(0, 180),
        thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url,
        duration: isoDuration(it.contentDetails?.duration), url: `https://www.youtube.com/watch?v=${it.id}`,
        trusted: TRUSTED.some((t) => it.snippet.channelTitle.toLowerCase().includes(t)),
      })).sort((a, b) => Number(b.trusted) - Number(a.trusted));
      return { source: "youtube", searchUrl, videos: list.slice(0, 4) };
    });
  } catch (e) {
    console.error("[videos]", e?.message || e);
    return { source: "search", searchUrl, videos: [], note: "YouTube API unavailable" };
  }
}
