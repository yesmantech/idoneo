import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import RoleSimulationSection from "@/components/concorsi/RoleSimulationSection";

export default function SimulationTypePage() {
  const { category, contestSlug } = useParams<{ category: string; contestSlug: string }>();
  const navigate = useNavigate();

  // State
  const [headerTitle, setHeaderTitle] = useState("Caricamento...");

  useEffect(() => {
    const loadData = async () => {
      // 1. Fetch Contest to get title
      const { data: contest } = await supabase.from('quizzes').select('title').eq('slug', contestSlug).single();

      if (contest) {
        setHeaderTitle(`Allenati per ${contest.title} `);
      }
    };
    loadData();
  }, [contestSlug]);

  return (
    <div className="min-h-screen bg-canvas-light text-text-primary pb-20">
      {/* Top Bar */}
      <div className="bg-white shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-5 md:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-brand-cyan transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-sm font-semibold hidden md:block">Torna al concorso</span>
          </button>
          <div className="font-bold text-text-primary truncate max-w-[200px] md:max-w-md">
            {headerTitle}
          </div>
          <div className="w-8"></div> {/* Spacer for balance */}
        </div>
      </div>

      <main className="container mx-auto px-5 md:px-6 py-8 max-w-4xl">
        <RoleSimulationSection
          category={category || ""}
          contestSlug={contestSlug || ""}
        />
      </main>
    </div>
  );
}
