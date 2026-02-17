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
import BandiScadenzaSection from "@/components/home/BandiScadenzaSection";
import NewArrivalsSection from "@/components/home/NewArrivalsSection";
import PopularSection from "@/components/home/PopularSection";
import SEOHead from "@/components/seo/SEOHead";
import { fetchRecentlyUsed, fetchNewArrivals, fetchMostPopular, fetchRecentCategories, type RecentlyUsedItem, type NewArrivalQuiz, type PopularRole } from "@/lib/homeSectionsService";
import { fetchClosingSoonBandi, type Bando } from "@/lib/bandiService";

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
  const [closingSoonBandi, setClosingSoonBandi] = useState<Bando[]>([]);
  const [newArrivals, setNewArrivals] = useState<NewArrivalQuiz[]>([]);
  const [popularRoles, setPopularRoles] = useState<PopularRole[]>([]);
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
    fetchClosingSoonBandi(7, 8).then(setClosingSoonBandi);
    fetchNewArrivals(30, 10).then(setNewArrivals);
    fetchMostPopular(5).then(setPopularRoles);
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
          <BlogHero />
        </section>

        {/* 2. SEARCH BAR - Overlaps hero for visual continuity with better spacing */}
        <section className="px-4 lg:px-8 mb-6 lg:mb-8 max-w-7xl lg:mx-auto lg:w-full relative z-20 -mt-4 lg:-mt-6">
          <SearchSection items={searchItems} />
        </section>

        {/* 3. RECENTLY USED - Quick access for returning users */}
        {recentlyUsed.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <RecentlyUsedSection items={recentlyUsed} />
          </section>
        )}

        {/* 4. BANDI IN SCADENZA - Urgency section */}
        {closingSoonBandi.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <BandiScadenzaSection bandi={closingSoonBandi} />
          </section>
        )}

        {/* 5. CONCORSI SECTIONS - Recommended */}
        <section className="mb-8 lg:mb-10">
          <ConcorsiSection
            title="Consigliati per te"
            contests={consigliati}
          />
        </section>

        {/* 5b. RECENTLY ADDED - Fresh content */}
        {recentCategories.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <ConcorsiSection
              title="Aggiunti di recente"
              contests={recentCategories}
            />
          </section>
        )}

        {/* 6. NEW ARRIVALS - Fresh content */}
        {newArrivals.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <NewArrivalsSection quizzes={newArrivals} />
          </section>
        )}

        {/* 7. POPULAR - Community favorites */}
        {popularRoles.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <PopularSection roles={popularRoles} />
          </section>
        )}

      </main>
    </div>
  );
}
