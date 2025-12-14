import React, { useEffect, useState } from "react";
import { getCategories, getAllSearchableItems, type Category, type SearchItem } from "../lib/data";
import { useAuth } from "@/context/AuthContext";
import BlogHero from "@/components/home/BlogHero";
import SearchSection from "@/components/home/SearchSection";
import ConcorsiSection from "@/components/home/ConcorsiSection";

// =============================================================================
// MAIN HOME PAGE - PIXEL PERFECT REDESIGN
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
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 pb-32">
      <main className="flex flex-col">

        {/* 1. BLOG HERO SECTION */}
        {/* Top margin: 16pt. Bottom margin: 16pt. */}
        <section style={{ marginTop: '16px', marginBottom: '16px' }}>
          <BlogHero />
        </section>

        {/* 2. SEARCH BAR */}
        {/* Sits under blog with 16pt gap (handled by margin above). 
            Horizontal padding: 16pt.
            Vertical spacing below: 24pt. 
        */}
        <section style={{ paddingLeft: '16px', paddingRight: '16px', marginBottom: '24px' }}>
          <SearchSection items={searchItems} />
        </section>

        {/* 3. CONCORSI SECTIONS */}
        {/* Section header handles its own top margin (24pt) if needed, 
            but we already have 24pt margin-bottom on search. 
            So the first section should just start.
        */}
        <section>
          <ConcorsiSection
            title="Concorsi consigliati per te"
            contests={consigliati}
          />
        </section>

        {/* 4. TUTTI CONCORSI (Another section) */}
        {/* Vertical spacing: 24pt between end of carousel and header of next */}
        <section>
          <ConcorsiSection
            title="Tutti i concorsi"
            contests={tuttiConcorsi}
          />
        </section>

      </main>
    </div>
  );
}
