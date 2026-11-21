import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { academies, allLessons, businessIdeas, lessonById, lessonPath, recentlyAdded, trending } from "../data";
import { candles, SIM_ASSETS } from "../lib/sim";
import { Disclaimer, Icon, inr, Page, Reveal, SectionHead } from "../components/ui";
import { cleanSym, fmtTime, useApi, type Overview } from "../lib/api";
import { useStore } from "../lib/store";
import { monthSummary, thisMonth } from "../lib/wallet";
import { Change, DataBadge, level, price } from "../components/market/bits";
import FloatingDashboard from "../components/FloatingDashboard";

export function HomeMarket() {
  const { data, error } = useApi<Overview>("/api/market/overview", { poll: 60e3, maxAge: 55e3 });
  const wallet = useStore((s) => s.wallet);
  const sum = monthSummary(wallet, thisMonth());
  return (
    <div className="glass rounded-3xl p-5 sm:p-6 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-display text-xl font-semibold">Markets today</h2>
        {data && <span className={`chip ${data.status.open ? "!text-emerald" : "!text-amber"}`}>Market {data.status.label} · {fmtTime(data.status.lastTradeTime)}</span>}
      </div>
      {error && <p className="text-sm text-muted">Live market data is unavailable right now.</p>}
      <div className="grid sm:grid-cols-3 gap-3">
        {(data?.indices ?? []).map((q) => (
          <Link key={q.symbol} to={`/stocks/${encodeURIComponent(q.symbol)}`} className="rounded-2xl border border-line p-3 hover:bg-card-strong">
            <div className="text-xs text-muted font-semibold">{q.name}</div>
            <div className="font-display text-xl font-semibold tabular-nums">{level(q.price)}</div>
            <Change pct={q.changePct} className="text-sm" />
          </Link>
        ))}
      </div>
      {data && (
        <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
          {[["Top gainers", data.gainers], ["Top losers", data.losers]].map(([t, list]) => (
            <div key={t as string}>
              <div className="text-xs text-muted mb-1">{t as string}</div>
              {(list as Overview["gainers"]).slice(0, 3).map((g) => (
                <Link key={g.symbol} to={`/stocks/${encodeURIComponent(g.symbol)}`} className="flex justify-between py-1 hover:text-cyan"><span>{cleanSym(g.symbol)}</span><span className="flex gap-3"><span className="tabular-nums">{price(g.price)}</span><Change pct={g.changePct} /></span></Link>
              ))}
            </div>
          ))}
        </div>
      )}
      {data && <DataBadge meta={data.meta} kind="Delayed quotes" className="mt-3" />}
      <div className="mt-4 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted">Wallet this month: <span className="text-emerald">{inr(sum.income)}</span> in · <span className="text-rose">{inr(sum.spent)}</span> spent · <span className="text-cyan">{inr(sum.remaining)}</span> left</span>
        <div className="flex gap-2"><Link to="/wallet" className="chip !text-cyan">Open Wallet</Link><Link to="/discover" className="chip">Discover</Link></div>
      </div>
    </div>
  );
}

gsap.registerPlugin(ScrollTrigger);
const HeroScene = lazy(() => import("../three/HeroScene"));

const CATS = [
  { icon: "chart", name: "Stock Market", to: "/stocks", text: "Shares, exchanges, indices and how to analyse a company." },
  { icon: "pie", name: "Mutual Funds", to: "/funds", text: "SIPs, NAV, fund types and choosing a fund." },
  { icon: "candle", name: "Trading", to: "/learn/trading", text: "Charts, indicators, risk and a paper-trading simulator." },
  { icon: "growth", name: "Investing", to: "/investments", text: "Compounding, allocation, goals, retirement and tax." },
  { icon: "bulb", name: "Business", to: "/business", text: "Startup roadmaps, costs and revenue models." },
  { icon: "shield", name: "Risk Management", to: "/learn/stocks/risk-management-stocks", text: "Position sizing, stops and protecting capital." },
];

function FloatingCard({ className, delay, children }: { className: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      className={`absolute glass rounded-2xl px-4 py-3 text-sm shadow-xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: [0, -10, 0] }}
      transition={{ opacity: { delay, duration: 0.6 }, y: { delay, duration: 6, repeat: Infinity, ease: "easeInOut" } }}
    >
      {children}
    </motion.div>
  );
}

export function LiveStyleMarket() {
  const asset = SIM_ASSETS[5];
  const [data, setData] = useState(() => candles(80, asset.seed, asset.start, 0.0003, asset.vol).map((c, i) => ({ i, v: +c.c.toFixed(2) })));
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setData((d) => {
        const last = d[d.length - 1];
        return [...d.slice(1), { i: last.i + 1, v: +(last.v * (1 + (Math.random() - 0.495) * 0.004)).toFixed(2) }];
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);
  const first = data[0].v, last = data[data.length - 1].v, up = last >= first;
  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-xs text-muted">{asset.name}</div>
          <div className="font-display text-3xl font-semibold">{last.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="text-right">
          <div className={up ? "text-emerald" : "text-rose"}>{up ? "▲" : "▼"} {(((last - first) / first) * 100).toFixed(2)}%</div>
          <span className="chip !text-amber mt-1">Simulated data · not live prices</span>
        </div>
      </div>
      <div className="h-44 mt-3">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs><linearGradient id="hm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} /></linearGradient></defs>
            <YAxis hide domain={["auto", "auto"]} />
            <Area dataKey="v" type="monotone" stroke="var(--cyan)" strokeWidth={2} fill="url(#hm)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 overflow-hidden mask-x">
        <div className="flex gap-6 animate-[ticker_30s_linear_infinite] w-max text-sm">
          {[...SIM_ASSETS, ...SIM_ASSETS].map((a, i) => {
            const cs = candles(30, a.seed, a.start, 0.0004, a.vol);
            const c = cs[cs.length - 1].c, ch = ((c - cs[0].c) / cs[0].c) * 100;
            return (
              <span key={i} className="whitespace-nowrap">
                <span className="font-semibold">{a.symbol}</span> <span className="text-muted">{inr(c, 2)}</span>{" "}
                <span className={ch >= 0 ? "text-emerald" : "text-rose"}>{ch >= 0 ? "+" : ""}{ch.toFixed(2)}%</span>
              </span>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-faint mt-3">A visual demo using fictional assets. FINOVA does not display live market prices; use your broker or the exchanges for real quotes.</p>
    </div>
  );
}

export default function Home() {
  const exploreRef = useRef<HTMLDivElement>(null);
  const lessonCount = allLessons.length;
  const { data: market } = useApi<Overview>("/api/market/overview", { poll: 60e3, maxAge: 55e3 });
  const nifty = market?.indices.find((i) => i.symbol === "^NSEI");

  useEffect(() => {
    if (!exploreRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".cat-card").forEach((el, i) => {
        gsap.fromTo(el, { y: 80, opacity: 0, rotateX: 25, scale: 0.94 }, {
          y: 0, opacity: 1, rotateX: 0, scale: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%", end: "top 60%", scrub: 0.8 },
          delay: i * 0.05,
        });
      });
      gsap.to(".explore-glow", { yPercent: -30, ease: "none", scrollTrigger: { trigger: exploreRef.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(".explore-title", { letterSpacing: "0.3em", opacity: 0.2 }, { letterSpacing: "0em", opacity: 1, scrollTrigger: { trigger: ".explore-title", start: "top 90%", end: "top 55%", scrub: true } });
    }, exploreRef);
    return () => ctx.revert();
  }, []);

  const trendLessons = useMemo(() => trending.map((id) => lessonById(id)!).filter(Boolean), []);
  const recent = useMemo(() => recentlyAdded.map((id) => lessonById(id)!).filter(Boolean), []);

  return (
    <Page>
      {/* HERO */}
      <section className="relative grid lg:grid-cols-[1fr_1.1fr] gap-6 items-center min-h-[calc(100vh-5rem)] -mt-8">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="chip !text-cyan mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" /> Markets · Paper trading · AI tutor · Wallet
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold tracking-tight leading-[0.9] text-[4.2rem] sm:text-8xl lg:text-[8.5rem] text-gradient hero-wordmark"
          >
            FINOVA
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.8 }} className="mt-4 font-display text-3xl sm:text-4xl font-semibold">
            Where Investors Are Made.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.8 }} className="mt-4 text-lg text-muted max-w-xl">
            Learn the market. Practice trading. Build financial intelligence.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 flex flex-wrap gap-3">
            <Link to="/stocks" className="btn-primary inline-flex items-center gap-2">Explore Markets <Icon name="arrow" className="w-4 h-4" /></Link>
            <Link to="/investments" className="btn-ghost inline-flex items-center gap-2"><Icon name="candle" className="w-4 h-4 text-emerald" /> Start Paper Trading</Link>
            <Link to="/ai" className="btn-ghost inline-flex items-center gap-2"><Icon name="spark" className="w-4 h-4 text-cyan" /> Meet FINOVA AI</Link>
          </motion.div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[[`${lessonCount}`, "lessons with quizzes"], ["14k+", "funds with real NAVs"], ["52", "NSE stocks tracked"]].map(([n, l]) => (
              <div key={l}><dt className="sr-only">{l}</dt><dd className="font-display text-3xl font-semibold">{n}</dd><div className="text-xs text-muted">{l}</div></div>
            ))}
          </motion.dl>
        </div>
        <div className="relative h-[440px] sm:h-[560px] lg:h-[680px] -mx-4 sm:mx-0">
          <Suspense fallback={<div className="absolute inset-0 grid place-items-center"><div className="w-72 h-72 rounded-full bg-cyan/10 blur-2xl" /></div>}>
            <HeroScene tickers={(market?.trending ?? []).map((t) => ({ symbol: cleanSym(t.symbol), changePct: t.changePct }))} />
          </Suspense>
          {nifty && (
            <FloatingCard className="left-2 sm:left-0 top-[8%]" delay={0.8}>
              <div className="text-xs text-muted">NIFTY 50 · delayed</div>
              <div className="font-display text-lg font-semibold tabular-nums">{level(nifty.price)}</div>
              <Change pct={nifty.changePct} className="text-xs" />
            </FloatingCard>
          )}
          {market && (
            <FloatingCard className="right-2 sm:right-0 top-[60%]" delay={1.1}>
              <div className="text-xs text-muted">Market breadth today</div>
              <div className="font-display text-lg font-semibold"><span className="text-emerald">{market.breadth.advancers}↑</span> <span className="text-rose">{market.breadth.decliners}↓</span></div>
              <div className="text-[10px] text-faint">of 52 tracked NSE stocks</div>
            </FloatingCard>
          )}
          <FloatingCard className="left-[6%] bottom-[5%] hidden md:block" delay={1.4}>
            <div className="text-xs text-muted">SIP ₹5,000/mo · 15 yrs @ 12%*</div>
            <div className="font-display text-lg font-semibold text-emerald">≈ ₹25.2 L</div>
          </FloatingCard>
          <div className="absolute bottom-0 right-2 text-[10px] text-faint">Orbiting labels: today's biggest movers (delayed). *Hypothetical, not guaranteed.</div>
        </div>
      </section>

      {/* FLOATING DASHBOARD */}
      <FloatingDashboard market={market} />

      {/* SCROLL INTRO TO CATEGORIES */}
      <section id="explore" ref={exploreRef} className="relative mt-28 scroll-mt-24 overflow-x-clip" style={{ perspective: 1200 }}>
        <div className="explore-glow absolute -top-20 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-violet/10 blur-3xl pointer-events-none" />
        <div className="text-center mb-12">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-3">Explore the financial world</div>
          <h2 className="explore-title font-display text-4xl sm:text-5xl font-semibold">Six worlds. One journey.</h2>
          <p className="mt-3 text-muted">Pick a path, or follow the academies in order from Beginner to Advanced.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATS.map((c) => (
            <Link key={c.name} to={c.to} className="cat-card group relative glass rounded-3xl p-6 overflow-hidden hover:border-cyan/50 transition-colors" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-cyan/20 to-violet/10 blur-2xl group-hover:scale-125 transition-transform duration-700" />
              <div className="relative w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-cyan/20 to-emerald/10 border border-line text-cyan group-hover:rotate-6 group-hover:scale-110 transition-transform">
                <Icon name={c.icon} className="w-6 h-6" />
              </div>
              <h3 className="relative mt-5 font-display text-xl font-semibold">{c.name}</h3>
              <p className="relative mt-2 text-sm text-muted">{c.text}</p>
              <div className="relative mt-5 text-sm text-cyan inline-flex items-center gap-1 group-hover:gap-2 transition-all">Enter <Icon name="arrow" className="w-4 h-4" /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED MODULES – bento */}
      <section className="mt-28">
        <Reveal><SectionHead eyebrow="Featured learning modules" title="A financial university in your pocket" sub="Every lesson has a simple explanation, a practical example, key points, a related video, a quiz and a next step." /></Reveal>
        <div className="grid md:grid-cols-6 gap-5">
          {academies.map((a, i) => {
            const span = i === 0 ? "md:col-span-4" : i === 1 ? "md:col-span-2" : i === 2 ? "md:col-span-2" : "md:col-span-4";
            const counts = ["Beginner", "Intermediate", "Advanced"].map((lv) => a.lessons.filter((l) => l.level === lv).length);
            return (
              <Reveal key={a.id} delay={i * 0.06} className={span}>
                <Link to={`/learn/${a.id}`} className="block h-full glass rounded-3xl p-6 hover:-translate-y-1 transition-transform relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${a.accent}, transparent)` }} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-semibold">{a.name}</h3>
                      <p className="text-muted mt-1">{a.tagline}</p>
                    </div>
                    <div className="font-display text-4xl font-semibold" style={{ color: a.accent }}>{a.lessons.length}</div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs">
                    {counts.map((n, k) => n > 0 && <span key={k} className="chip">{n} {["Beginner", "Intermediate", "Advanced"][k]}</span>)}
                  </div>
                  <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-muted">
                    {a.lessons.slice(0, i % 3 === 0 ? 6 : 3).map((l) => <li key={l.id} className="truncate">· {l.title}</li>)}
                  </ul>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* TRENDING + RECENT */}
      <section className="mt-28 grid lg:grid-cols-2 gap-10">
        <Reveal>
          <SectionHead eyebrow="Trending financial topics" title="What learners are exploring" />
          <div className="flex flex-wrap gap-3">
            {trendLessons.map((l, i) => (
              <Link key={l.id} to={lessonPath(l)} className="group rounded-full border border-line bg-card px-4 py-2.5 hover:border-cyan/60 transition-colors">
                <span className="text-faint mr-2 font-display">#{i + 1}</span>
                <span className="font-medium group-hover:text-cyan">{l.title}</span>
              </Link>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <SectionHead eyebrow="Recently added lessons" title="Fresh in the library" />
          <ol className="divide-y divide-line border-y border-line">
            {recent.map((l) => (
              <li key={l.id}>
                <Link to={lessonPath(l)} className="flex items-center justify-between gap-4 py-3.5 group">
                  <span>
                    <span className="font-medium group-hover:text-cyan">{l.title}</span>
                    <span className="block text-xs text-muted">{academies.find((a) => a.id === l.academy)!.name} · {l.minutes} min</span>
                  </span>
                  <Icon name="arrow" className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
                </Link>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* BUSINESS IDEAS – horizontal scroller */}
      <section className="mt-28">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead eyebrow="Popular business ideas" title="Turn skills into a business" sub="Investment estimates, skills, revenue models and step-by-step roadmaps." />
            <Link to="/business" className="btn-ghost mb-8">All {businessIdeas.length} ideas</Link>
          </div>
        </Reveal>
        <div className="flex gap-5 overflow-x-auto scroll-thin pb-4 snap-x">
          {businessIdeas.slice(0, 6).map((b) => (
            <Link key={b.id} to={`/business/${b.id}`} className="snap-start shrink-0 w-[280px] sm:w-[320px] glass rounded-3xl p-6 hover:border-emerald/50 transition-colors">
              <div className="text-xs text-emerald font-semibold">{b.categories[0]}</div>
              <h3 className="font-display text-xl font-semibold mt-2">{b.name}</h3>
              <p className="text-sm text-muted mt-2 line-clamp-3">{b.overview}</p>
              <div className="mt-4 text-sm"><span className="text-muted">Est. start-up cost </span><span className="font-semibold">{b.investment}</span></div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI CTA */}
      <section className="mt-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-line p-8 sm:p-12 bg-gradient-to-br from-cyan/10 via-violet/10 to-emerald/10">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold">Stuck on a concept? Ask <span className="text-gradient">FINOVA AI</span>.</h2>
              <p className="mt-3 text-muted">Get simple explanations with examples, learning roadmaps, lesson summaries and practice quizzes.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {["What is SIP?", "Explain P/E ratio with an example", "Give me a beginner roadmap"].map((q) => (
                  <Link key={q} to={`/ai?q=${encodeURIComponent(q)}`} className="chip !text-sm !py-2 !px-4 hover:!text-text">{q}</Link>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        <Disclaimer className="mt-8" />
      </section>
    </Page>
  );
}
