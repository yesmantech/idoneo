import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import RoleSimulationSection from "@/components/concorsi/RoleSimulationSection";

export default function SimulationTypePage() {
  const { category, role, contestSlug } = useParams<{ category: string; role: string; contestSlug: string }>();
  const navigate = useNavigate();

  // State
  const [headerTitle, setHeaderTitle] = useState("Caricamento...");

  useEffect(() => {
    const loadData = async () => {
      // 1. Fetch Contest to get title
      const { data: contest } = await supabase.from('quizzes').select('title, role:roles(title)').eq('slug', contestSlug).single();

      if (contest) {
        setHeaderTitle(`Allenati per ${contest.title} `);
      }
    };
    loadData();
  }, [contestSlug]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-sm font-medium">Torna al concorso</span>
          </button>
          <div className="font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">
            {headerTitle}
          </div>
          <div className="w-8"></div> {/* Spacer for balance */}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <RoleSimulationSection
          category={category || ""}
          role={role || ""}
          contestSlug={contestSlug || ""}
        />
      </main>
    </div>
  );
}
