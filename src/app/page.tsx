import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories, getAllSearchableItems, type Category, type SearchItem } from "../lib/data";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost } from "@/types/blog";
import {
  ChevronLeft, ChevronRight, Search,
  Sparkles, BookOpen, CheckCircle2,
  Shield, Building2, Heart, Briefcase, GraduationCap, Scale
} from "lucide-react";

// =============================================================================
// SHUFFLE-STYLE HERO BANNER - Connected to real blog system
// =============================================================================
function HeroBanner() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPost = async () => {
      try {
        // First try to get a featured post, otherwise get the latest published post
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, slug, title, subtitle, cover_image_url, category:blog_categories(name)')
          .eq('status', 'published')
          .order('is_featured', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setPost(data as BlogPost);
        }
      } catch (err) {
        console.error('Failed to fetch featured blog post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPost();
  }, []);

  // Default content if no post is available
  const title = post?.title || "Ultime novità sui concorsi!";
  const subtitle = post?.subtitle || "Scopri i bandi più recenti e le strategie vincenti";
  const categoryName = (post?.category as any)?.name || "Nuovo articolo";
  const postUrl = post?.slug ? `/blog/${post.slug}` : '/blog';

  const content = (
    <div
      className="flex items-center justify-center"
      style={{ height: '220px', width: '100%', padding: '0 16px' }}
    >
      {/* Hero card: 358x190px as per specs */}
      <div
        className="relative overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '358px',
          height: '190px',
          borderRadius: '24px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Cover image if available, otherwise gradient */}
        {post?.cover_image_url ? (
          <>
            <img
              src={post.cover_image_url}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)' }}
            />
          </>
        ) : (
          <>
            {/* Intense multi-color gradient like Shuffle (adapted to Idoneo) */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(125deg, 
                    #0891B2 0%, 
                    #0EA5E9 15%, 
                    #06B6D4 30%, 
                    #00B1FF 45%,
                    #10B981 65%,
                    #22C55E 80%,
                    #4ADE80 100%
                  )
                `
              }}
            />

            {/* LARGE GEM/CRYSTAL SHAPES like Shuffle */}
            <div
              className="absolute"
              style={{
                top: '-40px',
                right: '-30px',
                width: '180px',
                height: '180px',
                background: 'linear-gradient(135deg, #67E8F9 0%, #22D3EE 50%, #06B6D4 100%)',
                borderRadius: '20%',
                transform: 'rotate(45deg)',
                opacity: 0.9,
                boxShadow: 'inset 0 0 30px rgba(255,255,255,0.4), 0 0 40px rgba(6, 182, 212, 0.5)',
              }}
            />
            <div
              className="absolute"
              style={{
                bottom: '-30px',
                right: '30px',
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, #86EFAC 0%, #4ADE80 50%, #22C55E 100%)',
                borderRadius: '25%',
                transform: 'rotate(30deg)',
                opacity: 0.85,
                boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3), 0 0 30px rgba(34, 197, 94, 0.4)',
              }}
            />
            <div
              className="absolute"
              style={{
                top: '40px',
                right: '60px',
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)',
                borderRadius: '15%',
                transform: 'rotate(45deg)',
                boxShadow: '0 0 20px rgba(255,255,255,0.6)',
              }}
            />
            <div
              className="absolute"
              style={{
                top: '20px',
                right: '140px',
                width: '25px',
                height: '25px',
                background: '#67E8F9',
                borderRadius: '30%',
                transform: 'rotate(45deg)',
                boxShadow: '0 0 15px rgba(103, 232, 249, 0.8)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 60%)' }}
            />
          </>
        )}

        {/* Content: Tag + Headline + Subtitle */}
        <div
          className="relative z-10 h-full flex flex-col justify-between"
          style={{ padding: '20px 24px' }}
        >
          {/* Tag pill with icon */}
          <div
            className="self-start flex items-center gap-1.5"
            style={{
              padding: '5px 10px 5px 8px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span
              className="uppercase font-bold tracking-wider text-white"
              style={{ fontSize: '10px', letterSpacing: '0.5px' }}
            >
              {categoryName}
            </span>
          </div>

          {/* Text block at bottom */}
          <div>
            <h1
              className="font-black text-white leading-tight line-clamp-2"
              style={{
                fontSize: '22px',
                lineHeight: '1.15',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
                marginBottom: '6px',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="font-medium line-clamp-1"
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.4',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // If loading, show skeleton
  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: '220px', width: '100%', padding: '0 16px' }}
      >
        <div
          className="bg-slate-200 animate-pulse"
          style={{ width: '100%', maxWidth: '358px', height: '190px', borderRadius: '24px' }}
        />
      </div>
    );
  }

  // Wrap in Link if we have a post
  if (post?.slug) {
    return (
      <Link to={postUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// =============================================================================
// SEARCH BAR
// =============================================================================
// =============================================================================
// SEARCH BAR
// =============================================================================
// =============================================================================
// SEARCH BAR v2 (New Premium Design)
// =============================================================================
function SearchBarNew({ items }: { items: SearchItem[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length > 0) {
      const lower = val.toLowerCase().trim();
      const matches = items.filter(c => c.title.toLowerCase().includes(lower)).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (suggestions.length > 0) {
      navigate(suggestions[0].url);
      return;
    }
    const match = items.find(c => c.title.toLowerCase().includes(query.toLowerCase().trim()));
    if (match) navigate(match.url);
    else navigate(`/concorsi/tutti?search=${encodeURIComponent(query)}`);
  };

  const handleSelectSuggestion = (url: string) => {
    navigate(url);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative z-50">
      <form onSubmit={handleSearch} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-[#00B1FF]" />
        </div>
        <input
          type="text"
          placeholder="Cerca concorso (es. Guardia di Finanza 2024)..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length > 0) setShowSuggestions(true);
          }}
          className={`w-full h-[54px] pl-12 pr-5 bg-white 
                     text-[15px] font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal
                     focus:outline-none focus:ring-4 focus:ring-[#00B1FF]/10 
                     transition-all border border-slate-100 focus:border-[#00B1FF]/30
                     rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.03)]`}
        />
      </form>

      {/* Autocomplete Dropdown - Premium Floating Card */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 
                        rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 space-y-1">
            <div className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Risultati
            </div>

            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSelectSuggestion(suggestion.url)}
                className="w-full text-left px-4 py-3 rounded-[16px] hover:bg-slate-50 flex items-center gap-3 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center flex-shrink-0 text-xs font-black text-slate-400 group-hover:text-[#00B1FF] group-hover:border-[#00B1FF]/20 transition-colors">
                  {suggestion.title.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-700 group-hover:text-slate-900 truncate transition-colors">
                    {suggestion.title}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {suggestion.type === 'category' ? 'Categoria' : 'Concorso'}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                  <div className="w-8 h-8 rounded-full bg-[#00B1FF]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#00B1FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SEARCH BAR Legacy (Old Design)
// =============================================================================
function SearchBarLegacy({ items }: { items: SearchItem[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length > 0) {
      const lower = val.toLowerCase().trim();
      const matches = items.filter(c => c.title.toLowerCase().includes(lower)).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (suggestions.length > 0) {
      navigate(suggestions[0].url);
      return;
    }
    const match = items.find(c => c.title.toLowerCase().includes(query.toLowerCase().trim()));
    if (match) navigate(match.url);
    else navigate(`/concorsi/tutti?search=${encodeURIComponent(query)}`);
  };

  const handleSelectSuggestion = (url: string) => {
    navigate(url);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative z-50">
      <form onSubmit={handleSearch} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-[#00B1FF]" />
        </div>
        <input
          type="text"
          placeholder="Cerca concorso (es. Guardia di Finanza 2024)..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query.trim().length > 0) setShowSuggestions(true); }}
          className={`w-full h-[52px] pl-12 pr-5 bg-[#F5F5F5] 
                     text-[15px] font-medium text-slate-900 placeholder:text-slate-400 
                     focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:bg-white 
                     transition-all border border-transparent focus:border-[#00B1FF]/20
                     ${showSuggestions && suggestions.length > 0 ? 'rounded-t-[20px] rounded-b-none' : 'rounded-full'}`}
        />
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-[52px] left-0 right-0 bg-white border border-slate-100 
                        rounded-b-[20px] shadow-lg overflow-hidden py-2 animate-in fade-in slide-in-from-top-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion.url)}
              className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors group"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-[#00B1FF]" />
              <span className="text-[14px] text-slate-700 font-medium line-clamp-1 group-hover:text-slate-900">
                {suggestion.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SEARCH BAR MAIN
// =============================================================================
function SearchBar({ items }: { items: SearchItem[] }) {
  const { user } = useAuth();
  const isAdmin = user?.email === 'alessandro.valenza22@gmail.com';

  return isAdmin ? <SearchBarNew items={items} /> : <SearchBarLegacy items={items} />;
}

// =============================================================================
// SHUFFLE-STYLE CARD - Small tiles in a row, keeping Believe graphics
// Card width: ~110px (3 visible on 390px screen with padding/gaps)
// Height: ~160px (ratio ~1.45)
// =============================================================================
interface ShuffleCardProps {
  contest: Category;
  index: number;
}

function ShuffleCard({ contest, index }: ShuffleCardProps) {
  // Same soft gradient palette from Believe style
  const getStyle = (title: string, idx: number) => {
    const lower = title.toLowerCase();

    if (lower.includes('carabinieri')) {
      return { Icon: Shield, gradient: "from-[#4F8CFF] via-[#3B7BF7] to-[#2563EB]", glow: "rgba(59, 130, 246, 0.35)" };
    }
    if (lower.includes('polizia')) {
      return { Icon: Shield, gradient: "from-[#38BDF8] via-[#0EA5E9] to-[#0284C7]", glow: "rgba(14, 165, 233, 0.35)" };
    }
    if (lower.includes('finanza') || lower.includes('guardia')) {
      return { Icon: Shield, gradient: "from-[#FCD34D] via-[#F59E0B] to-[#D97706]", glow: "rgba(245, 158, 11, 0.35)" };
    }
    if (lower.includes('inps') || lower.includes('entrate') || lower.includes('agenzia')) {
      return { Icon: Building2, gradient: "from-[#94A3B8] via-[#64748B] to-[#475569]", glow: "rgba(100, 116, 139, 0.3)" };
    }
    if (lower.includes('sanità') || lower.includes('infermier')) {
      return { Icon: Heart, gradient: "from-[#FDA4AF] via-[#F43F5E] to-[#E11D48]", glow: "rgba(244, 63, 94, 0.35)" };
    }
    if (lower.includes('scuola') || lower.includes('docent')) {
      return { Icon: GraduationCap, gradient: "from-[#C4B5FD] via-[#A78BFA] to-[#7C3AED]", glow: "rgba(167, 139, 250, 0.35)" };
    }
    if (lower.includes('giustizia')) {
      return { Icon: Scale, gradient: "from-[#A5B4FC] via-[#818CF8] to-[#6366F1]", glow: "rgba(129, 140, 248, 0.35)" };
    }

    const defaults = [
      { gradient: "from-[#67E8F9] via-[#22D3EE] to-[#06B6D4]", glow: "rgba(34, 211, 238, 0.35)" },
      { gradient: "from-[#86EFAC] via-[#4ADE80] to-[#22C55E]", glow: "rgba(74, 222, 128, 0.35)" },
      { gradient: "from-[#DDD6FE] via-[#A78BFA] to-[#8B5CF6]", glow: "rgba(139, 92, 246, 0.35)" },
      { gradient: "from-[#FDBA74] via-[#FB923C] to-[#F97316]", glow: "rgba(251, 146, 60, 0.35)" },
    ];
    return { Icon: Briefcase, ...defaults[idx % defaults.length] };
  };

  const { Icon, gradient, glow } = getStyle(contest.title, index);

  // Demo data
  const postiDisponibili = 150 + (index * 73) % 400;
  const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'];
  const mese = mesi[index % 6];
  const anno = 2026;

  return (
    <Link
      to={`/concorsi/${contest.slug}`}
      className="flex-shrink-0 group relative"
      style={{ width: '110px' }}
    >
      {/* Card: 110x160px, keeping Believe-style graphics */}
      <div
        className="bg-white overflow-hidden transition-all duration-200 ease-out
                   group-hover:scale-[1.02] group-hover:-translate-y-0.5 group-hover:z-10
                   group-active:scale-[0.98] group-active:translate-y-0"
        style={{
          width: '110px',
          height: '160px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* HERO AREA: ~60% = 95px with gradient + glow */}
        <div
          className={`relative bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
          style={{ height: '95px' }}
        >
          {/* Creamy light from top - no dark bottom */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 60%)'
            }}
          />

          {/* Inner glow behind icon */}
          <div
            className="absolute"
            style={{
              width: '80px',
              height: '80px',
              background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
              filter: 'blur(12px)',
            }}
          />

          {/* Icon in frosted container */}
          <div
            className="relative z-10 flex items-center justify-center"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            <Icon
              className="text-white"
              style={{ width: '28px', height: '28px' }}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* TEXT AREA: ~40% = 65px */}
        <div
          className="flex flex-col justify-between"
          style={{ height: '65px', padding: '8px 10px 10px 10px' }}
        >
          {/* Title */}
          <h3
            className="font-bold text-[#1F2937] leading-tight line-clamp-2"
            style={{ fontSize: '11px', lineHeight: '1.3' }}
          >
            {contest.title}
          </h3>

          {/* Compact meta */}
          <div className="space-y-0.5">
            <p className="text-[#9CA3AF]" style={{ fontSize: '9px' }}>
              {mese} {anno}
            </p>
            <div className="flex items-center gap-1">
              <CheckCircle2
                className="text-[#22C55E] flex-shrink-0"
                style={{ width: '10px', height: '10px' }}
                fill="currentColor"
                stroke="white"
              />
              <span className="text-[#16A34A] font-medium" style={{ fontSize: '9px' }}>
                {postiDisponibili} posti
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// SHUFFLE-STYLE CAROUSEL - 3 cards visible in a row
// =============================================================================
function ShuffleCarousel({ contests }: { contests: Category[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      // Scroll by card width + gap = 122px
      const amount = direction === 'left' ? -122 : 122;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (!contests || contests.length === 0) return null;

  return (
    <div style={{ marginTop: '16px', marginBottom: '20px' }}>
      {/* Header */}
      <div
        className="flex justify-between items-center"
        style={{ paddingLeft: '16px', paddingRight: '16px', marginBottom: '16px' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="rounded-xl bg-gradient-to-br from-[#00B1FF]/20 to-[#00B1FF]/10 flex items-center justify-center"
            style={{ width: '32px', height: '32px' }}
          >
            <Sparkles className="w-4 h-4 text-[#00B1FF]" />
          </div>
          <h2 className="text-[17px] font-bold text-slate-900">Concorsi consigliati per te</h2>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 
                       flex items-center justify-center transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 
                       flex items-center justify-center transition-all shadow-sm"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Horizontal row of cards - 3 visible */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto overflow-y-visible scrollbar-hide"
        style={{ gap: '12px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '12px' }}
      >
        {contests.map((contest, idx) => (
          <ShuffleCard key={contest.id} contest={contest} index={idx} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// SMALL CARDS FOR "TUTTI I CONCORSI" - Same style
// =============================================================================
function ContentSection({ title, icon, contests }: { title: string; icon: React.ReactNode; contests: Category[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -122 : 122, behavior: 'smooth' });
    }
  };

  if (!contests || contests.length === 0) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        className="flex justify-between items-center"
        style={{ paddingLeft: '16px', paddingRight: '16px', marginBottom: '16px' }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[17px] font-bold text-slate-900">{title}</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-slate-200 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-slate-200 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto overflow-y-visible scrollbar-hide"
        style={{ gap: '12px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '12px' }}
      >
        {contests.map((contest, idx) => (
          <ShuffleCard key={contest.id} contest={contest} index={idx} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN HOME PAGE
// =============================================================================
export default function HomePage() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parallel fetch
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <main className="space-y-4 py-4">
        {/* HERO BANNER */}
        <section>
          <HeroBanner />
        </section>

        {/* SEARCH BAR */}
        <section style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <SearchBar items={searchItems} />
        </section>

        {/* CONCORSI CONSIGLIATI - Shuffle-style row with 3 cards visible */}
        <section>
          <ShuffleCarousel contests={consigliati} />
        </section>

        {/* TUTTI I CONCORSI */}
        <section>
          <ContentSection
            title="Tutti i concorsi"
            icon={
              <div
                className="rounded-xl bg-purple-100 flex items-center justify-center"
                style={{ width: '32px', height: '32px' }}
              >
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
            }
            contests={tuttiConcorsi}
          />
        </section>
      </main>
    </div>
  );
}
