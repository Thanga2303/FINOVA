import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import Nav, { BottomNav } from "./components/Nav";
import Search from "./components/Search";
import Footer from "./components/Footer";
import ReminderToasts from "./components/ReminderToasts";
import type { AcademyId } from "./data/types";

const Home = lazy(() => import("./pages/Home"));
const Learn = lazy(() => import("./pages/Learn"));
const AcademyPage = lazy(() => import("./pages/AcademyPage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const Business = lazy(() => import("./pages/Business"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const Videos = lazy(() => import("./pages/Videos"));
const AiPage = lazy(() => import("./pages/AiPage"));
const Profile = lazy(() => import("./pages/Profile"));
const Stocks = lazy(() => import("./pages/Stocks"));
const StockDetail = lazy(() => import("./pages/StockDetail"));
const Funds = lazy(() => import("./pages/Funds"));
const FundDetail = lazy(() => import("./pages/FundDetail"));
const FundCompare = lazy(() => import("./pages/FundCompare"));
const Investments = lazy(() => import("./pages/Investments"));
const Discover = lazy(() => import("./pages/Discover"));
const Wallet = lazy(() => import("./pages/Wallet"));
const NotFound = lazy(() => import("./pages/NotFound"));

const ACADEMIES: AcademyId[] = ["stocks", "mutual-funds", "trading", "investments"];

function AcademyRoute() {
  const { academy = "" } = useParams();
  return ACADEMIES.includes(academy as AcademyId) ? <AcademyPage key={academy} id={academy as AcademyId} /> : <NotFound />;
}

function Loading() {
  return (
    <div className="min-h-[70vh] grid place-items-center" aria-busy="true">
      <div className="h-10 w-10 rounded-full border-2 border-line border-t-cyan animate-spin" />
    </div>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return <motion.div aria-hidden className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-cyan via-emerald to-violet" style={{ scaleX: x }} />;
}

export default function App() {
  const loc = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
      const t = e.target;
      if (e.key === "/" && !(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement)) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  useEffect(() => {
    if (!loc.hash) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    else setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 350);
  }, [loc.pathname, loc.hash]);

  return (
    <>
      <div className="aurora" aria-hidden />
      <ScrollProgress />
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] btn-primary">Skip to content</a>
      <Nav onSearch={() => setSearchOpen(true)} />
      <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div id="content" className="pb-16 xl:pb-0">
        <Suspense fallback={<Loading />}>
          <AnimatePresence mode="wait">
            <Routes location={loc} key={loc.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/stocks/:symbol" element={<StockDetail />} />
              <Route path="/funds" element={<Funds />} />
              <Route path="/funds/compare" element={<FundCompare />} />
              <Route path="/funds/:code" element={<FundDetail />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/videos" element={<Videos />} />
              <Route path="/learn/:academy" element={<AcademyRoute />} />
              <Route path="/learn/:academy/:lessonId" element={<LessonPage />} />
              <Route path="/business" element={<Business />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="/ai" element={<AiPage />} />
              <Route path="/profile" element={<Profile />} />
              {/* Old addresses from FINOVA 1.x */}
              <Route path="/mutual-funds" element={<Navigate to="/learn/mutual-funds" replace />} />
              <Route path="/trading" element={<Navigate to="/learn/trading" replace />} />
              <Route path="/videos" element={<Navigate to={`/learn/videos${loc.search}`} replace />} />
              <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      <Footer />
      <BottomNav />
      <ReminderToasts />
    </>
  );
}
