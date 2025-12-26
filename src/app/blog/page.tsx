import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, BlogCategory } from "@/types/blog";
import { Search, X, ChevronLeft } from "lucide-react";

// =============================================================================
// BLOG INDEX PAGE - TON Foundation Style
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
            month: 'short'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Featured post (first post)
    const featuredPost = filteredPosts[0];
    const otherPosts = filteredPosts.slice(1);

    return (
        <div className="min-h-screen bg-white">
            {/* ============================================================= */}
            {/* HEADER - With Search Icon */}
            {/* ============================================================= */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100 pt-safe">
                <div className="max-w-[680px] mx-auto px-5 h-14 flex items-center justify-between">
                    {/* Left: Back Button (hidden when search is open) */}
                    {!isSearchOpen && (
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                            <span className="font-semibold text-[15px]">Indietro</span>
                        </button>
                    )}

                    {/* Search Bar - Expandable */}
                    {isSearchOpen ? (
                        <div className="flex-1 flex items-center gap-2 relative">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Cerca articoli..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 bg-slate-100 rounded-full text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00B1FF]/30"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                }}
                                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>

                            {/* Search Preview Dropdown */}
                            {searchQuery.trim() && filteredPosts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Risultati
                                        </div>
                                        {filteredPosts.slice(0, 5).map(post => (
                                            <Link
                                                key={post.id}
                                                to={`/blog/${post.slug}`}
                                                onClick={() => {
                                                    setIsSearchOpen(false);
                                                    setSearchQuery('');
                                                }}
                                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center flex-shrink-0 text-xs font-black text-slate-400 group-hover:text-[#00B1FF] overflow-hidden">
                                                    {post.cover_image_url ? (
                                                        <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        post.title.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[14px] font-semibold text-slate-900 truncate group-hover:text-[#00B1FF] transition-colors">
                                                        {post.title}
                                                    </div>
                                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                        {post.category?.name || 'Articolo'}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No results message */}
                            {searchQuery.trim() && filteredPosts.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 z-50">
                                    <div className="text-center text-slate-500 text-sm">
                                        Nessun articolo trovato
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setIsSearchOpen(true);
                                setTimeout(() => searchInputRef.current?.focus(), 100);
                            }}
                            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                            <Search className="w-5 h-5 text-slate-600" />
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-[680px] mx-auto px-5 py-6">
                {/* ============================================================= */}
                {/* CATEGORY FILTER */}
                {/* ============================================================= */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all ${activeCategory === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Tutti
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all ${activeCategory === cat.id
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* ============================================================= */}
                {/* FEATURED POST */}
                {/* ============================================================= */}
                {featuredPost && (
                    <Link to={`/blog/${featuredPost.slug}`} className="block mb-12 group">
                        {/* Cover Image */}
                        {featuredPost.cover_image_url && (
                            <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-5 bg-slate-100">
                                <img
                                    src={featuredPost.cover_image_url}
                                    alt={featuredPost.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        )}

                        {/* Meta Row */}
                        <div className="flex items-center gap-2 text-[14px] text-slate-500 mb-3">
                            <span>{formatDate(featuredPost.published_at)}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            {featuredPost.category && (
                                <>
                                    <span className="flex items-center gap-1">
                                        <span>📰</span>
                                        <span>{featuredPost.category.name}</span>
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                </>
                            )}
                            <span>{featuredPost.reading_time_minutes} min read</span>
                        </div>

                        {/* Title */}
                        <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 leading-[1.2] mb-3 group-hover:text-[#00B1FF] transition-colors">
                            {featuredPost.title}
                        </h2>

                        {/* Subtitle */}
                        {featuredPost.subtitle && (
                            <p className="text-[16px] text-slate-600 leading-[1.5] line-clamp-2">
                                {featuredPost.subtitle}
                            </p>
                        )}

                        {/* Author */}
                        <div className="flex items-center gap-2 mt-4">
                            {featuredPost.author?.avatar_url ? (
                                <img
                                    src={featuredPost.author.avatar_url}
                                    alt={featuredPost.author.display_name}
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-[#00B1FF] flex items-center justify-center text-white font-bold text-xs">
                                    I
                                </div>
                            )}
                            <span className="text-[13px] font-medium text-slate-600">
                                {featuredPost.author?.display_name || 'Idoneo'}
                            </span>
                        </div>
                    </Link>
                )}

                {/* ============================================================= */}
                {/* OTHER POSTS */}
                {/* ============================================================= */}
                {otherPosts.length > 0 && (
                    <div className="space-y-10">
                        {otherPosts.map(post => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="block group"
                            >
                                {/* Cover Image */}
                                {post.cover_image_url && (
                                    <div className="aspect-[16/10] overflow-hidden rounded-2xl mb-4 bg-slate-100">
                                        <img
                                            src={post.cover_image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}

                                {/* Meta Row */}
                                <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
                                    <span>{formatDate(post.published_at)}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    {post.category && (
                                        <>
                                            <span className="flex items-center gap-1">
                                                <span>📰</span>
                                                <span>{post.category.name}</span>
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        </>
                                    )}
                                    <span>{post.reading_time_minutes} min read</span>
                                </div>

                                {/* Title */}
                                <h3 className="text-[18px] font-bold text-slate-900 leading-[1.3] mb-2 group-hover:text-[#00B1FF] transition-colors">
                                    {post.title}
                                </h3>

                                {/* Subtitle */}
                                {post.subtitle && (
                                    <p className="text-[14px] text-slate-600 line-clamp-2">
                                        {post.subtitle}
                                    </p>
                                )}

                                {/* Author */}
                                <div className="flex items-center gap-2 mt-3">
                                    {post.author?.avatar_url ? (
                                        <img
                                            src={post.author.avatar_url}
                                            alt={post.author.display_name}
                                            className="w-5 h-5 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-[#00B1FF] flex items-center justify-center text-white font-bold text-[10px]">
                                            I
                                        </div>
                                    )}
                                    <span className="text-[12px] font-medium text-slate-500">
                                        {post.author?.display_name || 'Idoneo'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {filteredPosts.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-4">📝</div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Nessun articolo trovato</h3>
                        <p className="text-slate-500">Prova a selezionare un'altra categoria.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
