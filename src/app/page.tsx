import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, type Category } from "../lib/data";
import BlogHero from "../components/home/BlogHero";
import SearchSection from "../components/home/SearchSection";
import ConcorsiSection from "../components/home/ConcorsiSection";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  // Mock data splitting for demo purpose since we don't have real "featured" vs "recent" flags yet
  // In a real app, you'd filter by these properties.
  const featured = categories.slice(0, 5);
  const recent = categories.slice(5, 10).length > 0 ? categories.slice(5, 10) : categories.slice(0, 4);
  const closing = categories.slice(0, 4); // Just reusing for layout demo

  return (
    <div className="min-h-screen bg-canvas-light text-slate-900 pb-24 md:pb-20"> {/* Updated to canvas-light */}

      <main className="container mx-auto px-5 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 max-w-[1600px]"> {/* Added generous spacing */}

        {/* 1. Blog Hero Section */}
        <section>
          <BlogHero />
        </section>

        {/* 2. Main Search Hero */}
        <section>
          <SearchSection />
        </section>

        {/* 3. Concorsi Sections */}
        <div className="space-y-8 md:space-y-12">

          {/* In Primo Piano */}
          <section>
            {/* Mobile: Vertical List handled deeply in ConcorsiSection or generic CSS */}
            <ConcorsiSection title="🔥 Concorsi in primo piano" contests={featured} />
          </section>

          {/* Aperti di Recente */}
          <section>
            <ConcorsiSection title="🆕 Aperti di recente" contests={recent} />
          </section>

          {/* In Scadenza (Example of 3rd section) */}
          <section>
            <ConcorsiSection title="⏳ In scadenza" contests={closing} />
          </section>

        </div>

      </main>

    </div>
  );
}
