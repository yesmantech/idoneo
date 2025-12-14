import React, { useEffect, useState } from "react";
import { getCategories, getAllSearchableItems, type Category, type SearchItem } from "../lib/data";
import { useAuth } from "@/context/AuthContext";
import BlogHero from "@/components/home/BlogHero";
import SearchSection from "@/components/home/SearchSection";
import ConcorsiSection from "@/components/home/ConcorsiSection";

// =============================================================================
// MAIN HOME PAGE - SHUFFLE.COM STYLE SPACING
// Tight, compact layout with minimal gaps
// =============================================================================
export default function HomePage() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCategories(),
      getAllSearchableItems()
    ]).then(([cats, items]) => {
      setCategories(cats);
      setSearchItems(items);
      setLoading(false);
    });
  }, []);

  const consigliati = categories.slice(0, 8);
  const tuttiConcorsi = categories.slice(2, 12);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 pb-24">
      <main className="flex flex-col">

        {/* 1. BLOG HERO - No top padding, full bleed */}
        <section>
          <BlogHero />
        </section>

        {/* 2. SEARCH BAR - Overlapping blog section for ultra-tight spacing */}
        <section className="px-4 -mt-2">
          <SearchSection items={searchItems} />
        </section>

        {/* 3. CONCORSI SECTIONS - 24px gap from search */}
        <section className="mt-6">
          <ConcorsiSection
            title="Concorsi consigliati per te"
            contests={consigliati}
          />
        </section>

        {/* 4. TUTTI CONCORSI - 24px gap */}
        <section className="mt-6">
          <ConcorsiSection
            title="Tutti i concorsi"
            contests={tuttiConcorsi}
          />
        </section>

      </main>
    </div>
  );
}
