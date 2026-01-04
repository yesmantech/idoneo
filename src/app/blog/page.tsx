"use client";

import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, BlogCategory } from "@/types/blog";
import { Search, X, ChevronLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticSelection, hapticLight } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// =============================================================================
// BLOG INDEX PAGE - Tier S Premium Design
// =============================================================================
export default function BlogIndexPage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Load categories
        const { data: cats } = await supabase
            .from('blog_categories')
            .select('*')
            .order('sort_order');
        if (cats) setCategories(cats);

        // Load published posts
        const { data: postsData } = await supabase
            .from('blog_posts')
            .select(`
                *,
                category:blog_categories(*),
                author:blog_authors(*)
            `)
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false });

        if (postsData) setPosts(postsData as BlogPost[]);
        setLoading(false);
    };

    // Filter posts by category and search
    const filteredPosts = posts.filter(p => {
        // Category filter
        const matchesCategory = activeCategory === 'all' || p.category_id === activeCategory;

        // Search filter
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query ||
            p.title.toLowerCase().includes(query) ||
            (p.subtitle && p.subtitle.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleCategoryClick = (id: string) => {
        hapticSelection();
        setActiveCategory(id);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Featured post (first post)
    const featuredPost = filteredPosts[0];
    const otherPosts = filteredPosts.slice(1);

    return (
        <div className="min-h-screen bg-[#F3F5F7] dark:bg-[var(--background)] transition-colors duration-300">
            {/* ============================================================= */}
            {/* HEADER - Glassmorphism UI */}
            {/* ============================================================= */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[var(--card)]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800 pt-safe transition-colors">
                <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
                    {/* Left: Back Button */}
                    {!isSearchOpen && (
                        <button
                            onClick={() => { hapticLight(); navigate('/'); }}
                            className="flex items-center gap-2 group p-1 -ml-1"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <span className="font-bold text-[15px] text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Indietro</span>
                        </button>
                    )}

                    {/* Search Bar - Premium Expandable */}
                    <div className={cn(
                        "flex items-center gap-2 transition-all duration-300",
                        isSearchOpen ? "flex-1" : "w-10"
                    )}>
                        {isSearchOpen ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex items-center gap-2"
                            >
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Cerca un argomento..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-none outline-none focus:ring-2 focus:ring-[#00B1FF]/20 transition-all font-medium"
                                        autoFocus
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-300/50 dark:bg-slate-600/50 rounded-full flex items-center justify-center"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        hapticLight();
                                        setIsSearchOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className="text-slate-400 dark:text-slate-500 font-bold text-sm px-2"
                                >
                                    Annulla
                                </button>
                            </motion.div>
                        ) : (
                            <button
                                onClick={() => {
                                    hapticLight();
                                    setIsSearchOpen(true);
                                    setTimeout(() => searchInputRef.current?.focus(), 100);
                                }}
                                className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                            >
                                <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-5 py-8">
                {/* Title Section */}
                {!isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-black text-slate-900 dark:text-[var(--foreground)] tracking-tight">Blog di Idoneo</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Guide, consigli e novità sui concorsi.</p>
                    </motion.div>
                )}

                {/* ============================================================= */}
                {/* CATEGORY FILTER - Modern Capsules */}
                {/* ============================================================= */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide -mx-5 px-5">
                    <button
                        onClick={() => handleCategoryClick('all')}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-all shadow-sm",
                            activeCategory === 'all'
                                ? 'bg-[#00B1FF] text-white'
                                : 'bg-white dark:bg-[var(--card)] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800'
                        )}
                    >
                        Tutti
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className={cn(
                                "px-5 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-2",
                                activeCategory === cat.id
                                    ? 'bg-[#00B1FF] text-white'
                                    : 'bg-white dark:bg-[var(--card)] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800'
                            )}
                        >
                            {cat.icon && <span>{cat.icon}</span>}
                            {cat.name}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {filteredPosts.length > 0 ? (
                        <motion.div
                            key={activeCategory + searchQuery}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* ============================================================= */}
                            {/* FEATURED POST - Tier S Card */}
                            {/* ============================================================= */}
                            {featuredPost && activeCategory === 'all' && !searchQuery && (
                                <Link
                                    to={`/blog/${featuredPost.slug}`}
                                    onClick={() => hapticLight()}
                                    className="block group bg-white dark:bg-[var(--card)] rounded-[32px] p-4 lg:p-6 shadow-soft hover:shadow-card transition-all relative overflow-hidden active:scale-[0.98] border border-transparent dark:border-slate-800"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Cover */}
                                        {featuredPost.cover_image_url && (
                                            <div className="w-full md:w-2/5 aspect-[4/3] md:aspect-square overflow-hidden rounded-[24px] bg-slate-50 dark:bg-slate-800 shrink-0">
                                                <img
                                                    src={featuredPost.cover_image_url}
                                                    alt={featuredPost.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-col justify-center flex-1 pr-4">
                                            {/* Labels */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="px-3 py-1 bg-[#00B1FF]/10 dark:bg-[#00B1FF]/20 text-[#00B1FF] dark:text-sky-400 rounded-full text-[11px] font-black uppercase tracking-wider">
                                                    In evidenza
                                                </span>
                                                {featuredPost.category && (
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[11px] font-black uppercase tracking-wider">
                                                        {featuredPost.category.name}
                                                    </span>
                                                )}
                                            </div>

                                            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-[var(--foreground)] leading-[1.1] mb-4 group-hover:text-[#00B1FF] dark:group-hover:text-[#00B1FF] transition-colors line-clamp-3">
                                                {featuredPost.title}
                                            </h2>

                                            {featuredPost.subtitle && (
                                                <p className="text-[15px] lg:text-[16px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 mb-6">
                                                    {featuredPost.subtitle}
                                                </p>
                                            )}

                                            <div className="mt-auto flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider leading-none">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(featuredPost.published_at)}
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider leading-none">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {featuredPost.reading_time_minutes} min
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-[#00B1FF] flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* ============================================================= */}
                            {/* POST LIST - Tier S Grids/Cards */}
                            {/* ============================================================= */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {(activeCategory === 'all' && !searchQuery ? otherPosts : filteredPosts).map((post, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={post.id}
                                    >
                                        <Link
                                            to={`/blog/${post.slug}`}
                                            onClick={() => hapticLight()}
                                            className="block group bg-white dark:bg-[var(--card)] rounded-[32px] p-3.5 shadow-soft hover:shadow-card transition-all active:scale-[0.98] h-full border border-transparent dark:border-slate-800"
                                        >
                                            {/* Mini Cover */}
                                            {post.cover_image_url && (
                                                <div className="aspect-[16/10] overflow-hidden rounded-[24px] mb-4 bg-slate-50 dark:bg-slate-800">
                                                    <img
                                                        src={post.cover_image_url}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                </div>
                                            )}

                                            <div className="px-1.5 pb-2">
                                                {post.category && (
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#00B1FF] dark:text-sky-400 mb-2">
                                                        {post.category.name}
                                                    </div>
                                                )}

                                                <h3 className="text-lg font-black text-slate-900 dark:text-[var(--foreground)] leading-tight mb-2 group-hover:text-[#00B1FF] dark:group-hover:text-[#00B1FF] transition-colors line-clamp-2">
                                                    {post.title}
                                                </h3>

                                                {/* Meta */}
                                                <div className="flex items-center gap-3 mt-4">
                                                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(post.published_at)}
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {post.reading_time_minutes} MIN
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        /* Empty State */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-[var(--card)] rounded-[32px] py-16 px-6 text-center shadow-soft"
                        >
                            <div className="w-20 h-20 rounded-full bg-[#F3F5F7] dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 text-4xl">
                                🔍
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-[var(--foreground)] mb-2">Articoli non trovati</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                                Prova a cambiare categoria o a cercare qualcos'altro.
                            </p>
                            <button
                                onClick={() => { hapticLight(); setActiveCategory('all'); setSearchQuery(''); setIsSearchOpen(false); }}
                                className="mt-8 px-8 py-3 bg-[#00B1FF] text-white rounded-full font-bold shadow-lg shadow-[#00B1FF]/30 active:scale-95 transition-all"
                            >
                                Mostra tutti
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Added Footer Space for Mobile Navbar */}
            <div className="pb-32 lg:pb-12" />
        </div>
    );
}
