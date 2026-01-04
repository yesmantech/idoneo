import React, { useEffect, useState } from "react";
import { getCategories, getAllSearchableItems, type Category, type SearchItem } from "../lib/data";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingProvider";
import BlogHero from "@/components/home/BlogHero";
import SearchSection from "@/components/home/SearchSection";
import ConcorsiSection from "@/components/home/ConcorsiSection";

// =============================================================================
// MAIN HOME PAGE
// =============================================================================
export default function HomePage() {
  const { profile } = useAuth();
  const { hasCompletedOnboarding, startOnboarding } = useOnboarding();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    Promise.all([
      getCategories(),
      getAllSearchableItems()
    ]).then(([cats, items]) => {
      setCategories(cats);
      setSearchItems(items);
      setLoading(false);
    });

    // Offline Sync Trigger
    import("@/lib/offlineService").then(({ offlineService }) => {
      if (navigator.onLine) {
        offlineService.syncAndClean().then(count => {
          if (count > 0) console.log(`[Offline Sync] Synced ${count} attempts.`);
        });
      }
    });
  }, []);

  const consigliati = categories.slice(0, 8);
  const tuttiConcorsi = categories.slice(2, 12);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 transition-colors duration-300">
      <main className="flex flex-col">

        {/* 1. BLOG HERO - Immersive Entry */}
        <section>
          <BlogHero />
        </section>

        {/* 2. SEARCH BAR - Spotlight Trigger */}
        <section className="px-4 lg:px-8 -mt-4 lg:-mt-6 max-w-7xl lg:mx-auto lg:w-full relative z-20">
          <SearchSection items={searchItems} />
        </section>

        {/* 3. CONCORSI SECTIONS - Recommended */}
        <section className="mt-10 lg:mt-14">
          <ConcorsiSection
            title="Consigliati per te"
            contests={consigliati}
          />
        </section>

        {/* 4. TUTTI CONCORSI - Grid/Carousel */}
        <section className="mt-10 lg:mt-14">
          <ConcorsiSection
            title="Esplora concorsi"
            contests={tuttiConcorsi}
          />
        </section>

      </main>
    </div>
  );
}
