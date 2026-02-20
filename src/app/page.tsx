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
export default function HomePage() {
  const { profile, user } = useAuth();
  const { hasCompletedOnboarding, startOnboarding } = useOnboarding();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New section states
  const [recentlyUsed, setRecentlyUsed] = useState<RecentlyUsedItem[]>([]);
  const [newArrivals, setNewArrivals] = useState<NewArrivalQuiz[]>([]);
  const [popularQuizzes, setPopularQuizzes] = useState<PopularQuiz[]>([]);
  const [recentCategories, setRecentCategories] = useState<Category[]>([]);

  // Auto-start onboarding for first-time users
  useEffect(() => {
    if (!loading && !hasCompletedOnboarding) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startOnboarding();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, hasCompletedOnboarding, startOnboarding]);

  useEffect(() => {
    // Core data
    Promise.all([
      getCategories(),
      getAllSearchableItems()
    ]).then(([cats, items]) => {
      setCategories(cats);
      setSearchItems(items);
      setLoading(false);
    });

    // New sections data (non-blocking)
    fetchNewArrivals(30, 10).then(setNewArrivals);
    fetchMostPopular(5).then(setPopularQuizzes);
    fetchRecentCategories(8).then(setRecentCategories);

    // Offline Sync Trigger
    import("@/lib/offlineService").then(({ offlineService }) => {
      if (navigator.onLine) {
        offlineService.syncAndClean().then(count => {
          if (count > 0) console.log(`[Offline Sync] Synced ${count} attempts.`);
        });
      }
    });
  }, []);

  // Fetch recently used when user is available
  useEffect(() => {
    if (user?.id) {
      fetchRecentlyUsed(user.id, 5).then(setRecentlyUsed);
    }
  }, [user?.id]);

  const consigliati = categories.slice(0, 8);

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
        <section className="px-4 lg:px-8 mb-6 lg:mb-8 max-w-7xl lg:mx-auto lg:w-full relative z-20 -mt-4 lg:-mt-6">
          <Reveal width="100%" duration={0.6} delay={0.3} y={10}>
            <SearchSection items={searchItems} />
          </Reveal>
        </section>

        {/* 3. RECENTLY USED - Quick access for returning users */}
        {recentlyUsed.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <Reveal width="100%" delay={0.4}>
              <RecentlyUsedSection items={recentlyUsed} />
            </Reveal>
          </section>
        )}

        {/* 5. CONCORSI SECTIONS - Recommended */}
        <section className="mb-8 lg:mb-10">
          <Reveal width="100%" delay={0.6}>
            <ConcorsiSection
              title="Consigliati per te"
              contests={consigliati}
            />
          </Reveal>
        </section>

        {/* 5b. RECENTLY ADDED - Fresh content */}
        {recentCategories.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <Reveal width="100%" delay={0.7}>
              <ConcorsiSection
                title="Aggiunti di recente"
                contests={recentCategories}
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
