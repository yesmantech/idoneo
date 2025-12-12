import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, BlogCategory } from "@/types/blog";

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
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-canvas-light flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-squircle bg-brand-cyan/20 animate-pulse flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-brand-cyan animate-bounce" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-canvas-light font-sans text-slate-900 selection:bg-brand-cyan/20">
            {/* Header - Simple & Clean */}
            <header className="sticky top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-squircle bg-brand-cyan flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                            I
                        </div>
                        <span className="font-bold text-lg tracking-tight text-slate-900">IDONEO</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/concorsi" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Concorsi</Link>
                        <Link to="/blog" className="text-sm font-medium text-brand-cyan">Blog</Link>
                        <Link to="/stats" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Statistiche</Link>
                    </nav>
                </div>
            </header>

            <main className="pb-20">
                {/* Categories Bar - Sticky below header */}
                <div className="sticky top-16 z-40 bg-canvas-light/95 backdrop-blur-sm border-b border-slate-200/50">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-fade-right">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeCategory === 'all'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-white text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                Tutti
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeCategory === cat.id
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-white text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Title Section */}
                    <div className="mb-10 mt-4">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Blog & Novità</h1>
                        <p className="text-xl text-slate-500 max-w-2xl">
                            Consigli, strategie e aggiornamenti per vincere il tuo concorso.
                        </p>
                    </div>

                    {/* Posts Grid */}
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[32px] shadow-sm border border-dashed border-slate-200">
                            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">👻</div>
                            <h3 className="text-lg font-bold text-slate-900">Nessun articolo trovato</h3>
                            <p className="text-slate-500">Prova a cambiare categoria.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPosts.map(post => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    className="group flex flex-col h-full bg-transparent hover:bg-white hover:shadow-soft rounded-[24px] p-2 transition-all duration-300 hover:-translate-y-1"
                                >
                                    {/* Image Wrapper */}
                                    <div className="aspect-[16/9] overflow-hidden rounded-[20px] bg-slate-100 mb-4 relative">
                                        {post.cover_image_url ? (
                                            <img
                                                src={post.cover_image_url}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-black opacity-30">IDONEO</div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col flex-1 px-2 pb-2">
                                        {/* Date and Reading Time */}
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                                            <span>{formatDate(post.published_at)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{post.reading_time_minutes} MIN</span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-brand-blue transition-colors">
                                            {post.title}
                                        </h3>

                                        {/* Subtitle/Excerpt */}
                                        {post.subtitle && (
                                            <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-6 flex-1">
                                                {post.subtitle}
                                            </p>
                                        )}

                                        {/* Footer: Category & Author (if available) */}
                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100/50">
                                            {post.category && (
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md group-hover:bg-brand-cyan/10 group-hover:text-brand-cyan transition-colors">
                                                    {post.category.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-slate-200 bg-white py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="w-6 h-6 rounded-squircle bg-brand-cyan flex items-center justify-center text-white font-black text-xs">
                            I
                        </div>
                        <span className="font-bold text-slate-900">IDONEO</span>
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                        © {new Date().getFullYear()} Idoneo.io
                    </div>
                </div>
            </footer>
        </div>
    );
}
