import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import Search from "./components/Search";
import Footer from "./components/Footer";

const Home = lazy(() => import("./pages/Home"));
const Learn = lazy(() => import("./pages/Learn"));
const AcademyPage = lazy(() => import("./pages/AcademyPage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const Business = lazy(() => import("./pages/Business"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const Videos = lazy(() => import("./pages/Videos"));
const AiPage = lazy(() => import("./pages/AiPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Loading() {
  return (
    <div className="min-h-[70vh] grid place-items-center" aria-busy="true">
      <div className="h-10 w-10 rounded-full border-2 border-line border-t-cyan animate-spin" />
    </div>
  );
}

export default function App() {
  const loc = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
      }
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
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] btn-primary">Skip to content</a>
      <Nav onSearch={() => setSearchOpen(true)} />
      <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div id="content">
        <Suspense fallback={<Loading />}>
          <AnimatePresence mode="wait">
            <Routes location={loc} key={loc.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/stocks" element={<AcademyPage id="stocks" />} />
              <Route path="/mutual-funds" element={<AcademyPage id="mutual-funds" />} />
              <Route path="/trading" element={<AcademyPage id="trading" />} />
              <Route path="/investments" element={<AcademyPage id="investments" />} />
              <Route path="/learn/:academy/:lessonId" element={<LessonPage />} />
              <Route path="/business" element={<Business />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/ai" element={<AiPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
