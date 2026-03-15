/**
 * @file HomePage.tsx
 * @description The main entry point ("Landing Page") of the application.
 *
 * ## Layout Structure
 *
 * 1. **BlogHero**: Immersive top section with latest news/articles
 * 2. **SearchSection**: Prominent search bar triggering Spotlight
 * 3. **RecentlyUsedSection**: Last practiced roles (if logged in)
 * 4. **BandiScadenzaSection**: Bandi expiring soon
 * 5. **ConcorsiSection (Recommended)**: Personalized suggestions
 * 6. **NewArrivalsSection**: Recently added quizzes
 * 7. **PopularSection**: Community favorites
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // TEMPORARY: for testing redirect
import { Plus } from "lucide-react";
import { getCategories, getAllSearchableItems, type Category, type SearchItem } from "../lib/data";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingProvider";
import BlogHero from "@/components/home/BlogHero";
import SearchSection from "@/components/home/SearchSection";
import ConcorsiSection from "@/components/home/ConcorsiSection";
import RecentlyUsedSection from "@/components/home/RecentlyUsedSection";
import NewArrivalsSection from "@/components/home/NewArrivalsSection";
import PopularSection from "@/components/home/PopularSection";
import SEOHead from "@/components/seo/SEOHead";
import { Reveal } from "@/components/ui/Reveal";
import { fetchRecentlyUsed, fetchNewArrivals, fetchMostPopular, fetchRecentCategories, type RecentlyUsedItem, type NewArrivalQuiz, type PopularQuiz } from "@/lib/homeSectionsService";

// =============================================================================
// MAIN HOME PAGE
// =============================================================================
const HOME_CACHE_KEY = 'idoneo_home_cache';
const HOME_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function readHomeCache(userId: string | undefined) {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.userId !== (userId ?? 'anon')) return null; // different user
    if (Date.now() - parsed.ts > HOME_CACHE_TTL) return null; // expired
    return parsed;
  } catch { return null; }
}

function writeHomeCache(userId: string | undefined, data: object) {
  try {
    localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ userId: userId ?? 'anon', ts: Date.now(), ...data }));
  } catch { /* quota exceeded, ignore */ }
}

export default function HomePage() {
  const { profile, user, loading: authLoading } = useAuth();
  const { hasCompletedContext, startOnboarding } = useOnboarding();
  const navigate = useNavigate(); // TEMPORARY: for testing redirect

  // ── INSTANT: lazy initializers read localStorage synchronously ─────────────
  // useState's lazy initializer (() => ...) runs exactly once on mount,
  // before auth resolves. This gives us instant content from cache.
  const [categories, setCategories] = useState<Category[]>(() => {
    try { return JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || '{}')?.categories ?? []; } catch { return []; }
  });
  const [searchItems, setSearchItems] = useState<SearchItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || '{}')?.searchItems ?? []; } catch { return []; }
  });
  const [recentlyUsed, setRecentlyUsed] = useState<RecentlyUsedItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || '{}')?.recentlyUsed ?? []; } catch { return []; }
  });
  const [newArrivals, setNewArrivals] = useState<NewArrivalQuiz[]>(() => {
    try { return JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || '{}')?.newArrivals ?? []; } catch { return []; }
  });
  const [popularQuizzes, setPopularQuizzes] = useState<PopularQuiz[]>(() => {
    try { return JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || '{}')?.popularQuizzes ?? []; } catch { return []; }
  });
  const [recentCategories, setRecentCategories] = useState<Category[]>(() => {
    try { return JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || '{}')?.recentCategories ?? []; } catch { return []; }
  });
  // loading=false if we have cached categories (enough to show the page)
  const [loading, setLoading] = useState<boolean>(() => {
    try { const c = JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || '{}'); return !c?.categories?.length; } catch { return true; }
  });




  // Auto-start onboarding for first-time users
  useEffect(() => {
    if (!loading && !hasCompletedContext('homepage')) {
      const timer = setTimeout(() => startOnboarding('homepage'), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, hasCompletedContext, startOnboarding]);

  // ── BACKGROUND: refresh data from network ─────────────────────────────────
  // Runs after auth resolves. Fetches fresh data and updates both state
  // and localStorage cache. The UI updates silently without any shift
  // because sections already have data from cache.
  useEffect(() => {
    if (authLoading) return;

    Promise.all([
      getCategories(),
      getAllSearchableItems(),
      user?.id ? fetchRecentlyUsed(user.id, 5) : Promise.resolve([]),
      fetchNewArrivals(30, 10),
      fetchMostPopular(5),
      fetchRecentCategories(8),
    ]).then(([cats, items, recent, arrivals, popular, recCats]) => {
      const data = {
        categories: cats as Category[],
        searchItems: items as SearchItem[],
        recentlyUsed: recent as RecentlyUsedItem[],
        newArrivals: arrivals as NewArrivalQuiz[],
        popularQuizzes: popular as PopularQuiz[],
        recentCategories: recCats as Category[],
      };
      setCategories(data.categories);
      setSearchItems(data.searchItems);
      setRecentlyUsed(data.recentlyUsed);
      setNewArrivals(data.newArrivals);
      setPopularQuizzes(data.popularQuizzes);
      setRecentCategories(data.recentCategories);
      setLoading(false);
      writeHomeCache(user?.id, data);
    });

    import("@/lib/offlineService").then(({ offlineService }) => {
      if (navigator.onLine) offlineService.syncAndClean();
    });
  }, [authLoading, user?.id]);

  // Personalization: if user completed onboarding with selected categories,
  // show those first. Otherwise fall back to generic top 8.
  const hasOnboarding = !!profile?.onboarding_completed_at;
  const onboardingCatIds = profile?.onboarding_categories || [];

  const consigliati = hasOnboarding && onboardingCatIds.length > 0
    ? categories.filter(c => onboardingCatIds.includes(c.id))
    : categories.slice(0, 8);

  const consigliatiTitle = hasOnboarding && onboardingCatIds.length > 0
    ? 'I tuoi Concorsi'
    : 'Consigliati per te';

  // Show remaining categories if user has personalized ones
  const altreCategorie = hasOnboarding && onboardingCatIds.length > 0
    ? categories.filter(c => !onboardingCatIds.includes(c.id)).slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 transition-colors duration-300">
      <SEOHead
        title="Il miglior simulatore per i tuoi Concorsi Pubblici"
        description="Preparati al meglio per i concorsi di Polizia, Carabinieri, Forze Armate e molto altro con quiz ufficiali e statistiche avanzate."
      />
      <main className="flex flex-col">

        {/* 1. BLOG HERO - Immersive Entry */}
        <section>
          <Reveal width="100%" duration={0.8} delay={0.1}>
            <BlogHero />
          </Reveal>
        </section>

        {/* 2. SEARCH BAR - Overlaps hero for visual continuity with better spacing */}
        <Reveal width="100%" duration={0.6} delay={0.3} y={10} className="px-4 lg:px-8 mb-6 lg:mb-8 max-w-7xl lg:mx-auto lg:w-full relative z-20 -mt-4 lg:-mt-6">
          <SearchSection items={searchItems} />
        </Reveal>

        {/* 3. RECENTLY USED - Quick access for returning users */}
        {/* Always reserve space while auth is resolving (prevents CLS).
            Once settled: show for logged-in users (even empty → skeleton),
            hide entirely for anonymous users with no history. */}
        {(authLoading || !!user?.id || recentlyUsed.length > 0) && (
          <section className="mb-8 lg:mb-10">
            <Reveal width="100%" delay={0.4}>
              <RecentlyUsedSection
                items={recentlyUsed}
                loading={authLoading || (!!user?.id && recentlyUsed.length === 0)}
              />
            </Reveal>
          </section>
        )}

        {/* 5. CONCORSI SECTIONS - Personalized or Recommended */}
        <section className="mb-8 lg:mb-10">
          <Reveal width="100%" delay={0.6}>
            <ConcorsiSection
              title={consigliatiTitle}
              contests={consigliati}
            />
          </Reveal>
        </section>

        {/* 5a. SCOPRI ANCHE — Other categories (only after onboarding) */}
        {altreCategorie.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <Reveal width="100%" delay={0.65}>
              <ConcorsiSection
                title="Scopri anche"
                contests={altreCategorie}
              />
            </Reveal>
          </section>
        )}

        {/* 5b. RECENTLY ADDED - Fresh content */}
        {recentCategories.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <Reveal width="100%" delay={0.7}>
              <ConcorsiSection
                title="Aggiunti di recente"
                contests={recentCategories}
                icon={Plus}
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                iconColor="text-emerald-600"
              />
            </Reveal>
          </section>
        )}

        {/* 6. NEW ARRIVALS - Fresh content */}
        {newArrivals.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <Reveal width="100%" delay={0.8}>
              <NewArrivalsSection quizzes={newArrivals} />
            </Reveal>
          </section>
        )}

        {/* 7. POPULAR - Community favorites */}
        {popularQuizzes.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <Reveal width="100%" delay={0.9}>
              <PopularSection quizzes={popularQuizzes} />
            </Reveal>
          </section>
        )}

      </main>
    </div>
  );
}
