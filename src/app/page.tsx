import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, type Category } from "../lib/data";
import BlogHero from "../components/home/BlogHero";
import SearchSection from "../components/home/SearchSection";
import ConcorsiSection from "../components/home/ConcorsiSection";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  // Mock data splitting for demo purpose
  const featured = categories.slice(0, 5);
  const recent = categories.slice(5, 10).length > 0 ? categories.slice(5, 10) : categories.slice(0, 4);
  const closing = categories.slice(0, 4);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 md:pb-20">

      <main className="container mx-auto px-5 md:px-6 py-6 md:py-8 space-y-6 md:space-y-10 max-w-[1200px]">

        {/* Welcome Header */}
        <section className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {profile?.nickname ? `${getGreeting()}, ${profile.nickname}` : getGreeting()}! 👋
          </h1>
          <p className="text-[15px] md:text-base text-[#6B6B6B] font-medium">
            Cosa vuoi studiare oggi?
          </p>
        </section>

        {/* Search */}
        <section>
          <SearchSection />
        </section>

        {/* Blog Hero Section */}
        <section>
          <BlogHero />
        </section>

        {/* Concorsi Sections */}
        <div className="space-y-8 md:space-y-10">

          <section>
            <ConcorsiSection title="🔥 In primo piano" contests={featured} />
          </section>

          <section>
            <ConcorsiSection title="🆕 Aperti di recente" contests={recent} />
          </section>

          <section>
            <ConcorsiSection title="⏳ In scadenza" contests={closing} />
          </section>

        </div>

      </main>

    </div>
  );
}
