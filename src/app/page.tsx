import React, { useEffect, useState } from "react";
import { getCategories, getAllSearchableItems, type Category, type SearchItem } from "../lib/data";
import { useAuth } from "@/context/AuthContext";
import BlogHero from "@/components/home/BlogHero";
import SearchSection from "@/components/home/SearchSection";
import ConcorsiSection from "@/components/home/ConcorsiSection";

// =============================================================================
// MAIN HOME PAGE
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
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 pb-24">
      <main className="flex flex-col">

        {/* 1. BLOG HERO */}
        <section>
          <BlogHero />
        </section>

        {/* 2. SEARCH BAR */}
        <section className="px-4 lg:px-8 -mt-2 max-w-7xl lg:mx-auto lg:w-full">
          <SearchSection items={searchItems} />
        </section>

        {/* 3. CONCORSI SECTIONS */}
        <section className="mt-6 lg:mt-10">
          <ConcorsiSection
            title="Concorsi consigliati per te"
            contests={consigliati}
          />
        </section>

        {/* 4. TUTTI CONCORSI */}
        <section className="mt-6 lg:mt-10">
          <ConcorsiSection
            title="Tutti i concorsi"
            contests={tuttiConcorsi}
          />
        </section>

      </main>
    </div>
  );
}
