import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, BlogCategory } from "@/types/blog";
import { Search, Menu } from "lucide-react";

// =============================================================================
// BLOG INDEX PAGE - TON Foundation Style
// =============================================================================
export default function BlogIndexPage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');

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

    // Filter posts by category
    const filteredPosts = activeCategory === 'all'
        ? posts
        : posts.filter(p => p.category_id === activeCategory);

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
            {/* HEADER - TON Style */}
            {/* ============================================================= */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="max-w-[680px] mx-auto px-5 h-14 flex items-center justify-between">
                    {/* Left: Logo + Blog */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#00B1FF] flex items-center justify-center text-white font-bold text-sm">
                            I
                        </div>
                        <span className="font-bold text-slate-900">Blog</span>
                    </Link>

                    {/* Right: Search + Menu */}
                    <div className="flex items-center gap-3">
                        <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                            <Search className="w-5 h-5 text-slate-600" />
                        </button>
                        <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                            <Menu className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[680px] mx-auto px-5 py-8">
                {/* ============================================================= */}
                {/* CATEGORY FILTER */}
                {/* ============================================================= */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
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

            {/* ============================================================= */}
            {/* FOOTER */}
            {/* ============================================================= */}
            <footer className="border-t border-slate-100 py-8 mt-12">
                <div className="max-w-[680px] mx-auto px-5">
                    <div className="flex items-center justify-between text-[13px] text-slate-500">
                        <Link to="/" className="flex items-center gap-2 hover:text-slate-900 transition-colors">
                            <div className="w-6 h-6 rounded-md bg-[#00B1FF] flex items-center justify-center text-white font-bold text-xs">
                                I
                            </div>
                            <span className="font-medium">Idoneo</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                            <Link to="/terms" className="hover:text-slate-900 transition-colors">Termini</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
