import { Suspense, lazy, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import FilterBar from "./components/layout/FilterBar";
import MobileNav from "./components/layout/MobileNav";
import { Skeleton } from "./components/ui/Skeleton";

const Overview = lazy(() => import("./pages/Overview"));
const Officials = lazy(() => import("./pages/Officials"));
const OfficialDetail = lazy(() => import("./pages/OfficialDetail"));
const Plays = lazy(() => import("./pages/Plays"));
const Games = lazy(() => import("./pages/Games"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const Insights = lazy(() => import("./pages/Insights"));
const WhistleStop = lazy(() => import("./pages/WhistleStop"));

function PageFallback() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-2/3 max-w-lg" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="min-h-full flex">
      <Sidebar />
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <FilterBar />
        <main
          id="main"
          className="flex-1 px-5 md:px-10 py-8 md:py-12 max-w-[1600px] w-full mx-auto"
        >
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/officials" element={<Officials />} />
              <Route path="/officials/:name" element={<OfficialDetail />} />
              <Route path="/plays" element={<Plays />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/:id" element={<GameDetail />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/whistlestop" element={<WhistleStop />} />
              <Route
                path="*"
                element={
                  <div className="text-ink-500 text-sm">Not found.</div>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
