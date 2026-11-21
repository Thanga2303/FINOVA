import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { allLessons } from "../data";
import type { Overview } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { levelFor, PAPER_CASH, useStore } from "../lib/store";
import { TiltCard } from "./fx";
import { Icon, inr } from "./ui";

gsap.registerPlugin(ScrollTrigger);

/** FINOVA's mission as four connected steps, each showing the user's own live status. */
export default function MissionPillars({ market }: { market: Overview | null }) {
  const ref = useRef<HTMLElement>(null);
  const done = useStore((s) => Object.keys(s.completed).length);
  const paper = useStore((s) => s.paper);
  const xp = useStore((s) => s.xp);
  const { level } = levelFor(xp);
  const executed = paper.orders.filter((o) => o.status === "EXECUTED").length;

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".mission-line", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ref.current, start: "top 75%", end: "top 30%", scrub: 0.6 } });
      gsap.fromTo(".mission-word", { opacity: 0.15, y: 14 }, { opacity: 1, y: 0, stagger: 0.12, ease: "power2.out", scrollTrigger: { trigger: ref.current, start: "top 80%", end: "top 45%", scrub: 0.6 } });
    }, ref);
    return () => ctx.revert();
  }, []);

  const pillars = [
    { n: "01", word: "Learn.", icon: "bulb", to: "/learn", cta: "Open the academies", stat: `${done}/${allLessons.length}`, statLabel: "lessons completed", text: "65 lessons from “what is a share?” to portfolio construction, with videos and quizzes." },
    { n: "02", word: "Practice.", icon: "candle", to: "/investments", cta: "Go to paper trading", stat: inr(paper.cash), statLabel: `virtual balance · ${executed} paper orders`, text: `Trade real NSE stocks and AMFI funds on paper with ${inr(PAPER_CASH)} of virtual money. No real money, ever.` },
    { n: "03", word: "Analyse.", icon: "chart", to: "/stocks", cta: "Explore the markets", stat: market ? `${market.breadth.advancers}↑ ${market.breadth.decliners}↓` : "—", statLabel: "market breadth today (delayed)", text: "Charts, fundamentals, statements and fund comparisons built on real, labelled data." },
    { n: "04", word: "Master the Market.", icon: "trophy", to: "/ai", cta: "Meet FINOVA AI", stat: level.name, statLabel: `${xp} XP earned`, text: "Level up from Beginner to Finance Master with an AI tutor, planner and research assistant." },
  ];

  return (
    <section ref={ref} className="relative mt-28" aria-labelledby="mission-title">
      <div className="text-center max-w-3xl mx-auto">
        <div className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan mb-4">Our mission</div>
        <h2 id="mission-title" className="font-display text-3xl sm:text-5xl font-semibold leading-tight">
          {["Learn.", "Practice.", "Analyse."].map((w) => <span key={w} className="mission-word inline-block mr-3">{w}</span>)}
          <br className="hidden sm:block" />
          <span className="mission-word inline-block text-gradient">Master the Market.</span>
        </h2>
      </div>
      <div className="relative mt-12">
        <div aria-hidden className="mission-line hidden lg:block absolute left-[12%] right-[12%] top-9 h-px origin-left bg-gradient-to-r from-cyan via-emerald to-violet opacity-70" />
        <ol className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p) => (
            <li key={p.n}>
              <Link to={p.to} className="block h-full" aria-label={`${p.word} ${p.cta}`}>
                <TiltCard className="p-5 sm:p-6 !bg-bg2/95" max={6}>
                  <div className="flex items-center justify-between">
                    <span className="w-11 h-11 rounded-2xl grid place-items-center bg-bg2 border border-cyan/30 text-cyan shadow-[0_0_24px_-8px_var(--cyan)]"><Icon name={p.icon} className="w-5 h-5" /></span>
                    <span className="font-display text-sm text-faint tracking-widest">{p.n}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold mt-5">{p.word}</h3>
                  <p className="text-sm text-muted mt-2 min-h-[3.75rem]">{p.text}</p>
                  <div className="mt-5 pt-4 border-t border-line">
                    <div className="font-display text-lg font-semibold tabular-nums">{p.stat}</div>
                    <div className="text-[11px] text-faint">{p.statLabel}</div>
                  </div>
                  <div className="mt-4 text-sm text-cyan inline-flex items-center gap-1">{p.cta} <Icon name="arrow" className="w-4 h-4" /></div>
                </TiltCard>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Quiet trust strip: where data comes from and what FINOVA will never do. */
export function TrustStrip() {
  const items = [
    ["chart", "NSE/BSE quotes & fundamentals", "Yahoo Finance, delayed"],
    ["pie", "Every mutual fund NAV", "AMFI daily data"],
    ["shield", "No real money moved", "Paper trading only"],
    ["bulb", "Education, not advice", "Built for Indian investors"],
  ];
  return (
    <section aria-label="Data sources and safety" className="mt-4 rounded-3xl border border-line bg-card/60 backdrop-blur-md">
      <ul className="grid grid-cols-2 lg:grid-cols-4 divide-line lg:divide-x">
        {items.map(([icon, a, b]) => (
          <li key={a} className="flex items-center gap-3 p-4">
            <Icon name={icon} className="w-5 h-5 text-emerald shrink-0" />
            <span className="min-w-0"><span className="block text-sm font-medium">{a}</span><span className="block text-xs text-faint">{b}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
