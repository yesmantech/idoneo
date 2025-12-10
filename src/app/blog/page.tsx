import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, BlogCategory, STATUS_CONFIG } from "@/types/blog";

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

    // Featured post (first is_featured or first post)
    const featuredPost = posts.find(p => p.is_featured) || posts[0];
    const regularPosts = filteredPosts.filter(p => p.id !== featuredPost?.id);

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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-slate-500">Caricamento...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="text-xl font-black text-slate-900">IDONEO</Link>
                    <nav className="flex items-center gap-6">
                        <Link to="/concorsi" className="text-slate-600 hover:text-slate-900">Concorsi</Link>
                        <Link to="/blog" className="text-emerald-600 font-medium">Blog</Link>
                        <Link to="/stats" className="text-slate-600 hover:text-slate-900">Statistiche</Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-emerald-50 to-white py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-black text-slate-900 mb-3">Blog & Novità</h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Guide pratiche, news sui concorsi pubblici e strategie di studio per vincere il tuo concorso.
                        </p>
                    </div>

                    {/* Featured Post */}
                    {featuredPost && (
                        <Link
                            to={`/blog/${featuredPost.slug}`}
                            className="block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-slate-100"
                        >
                            <div className="grid md:grid-cols-2 gap-6">
                                {featuredPost.cover_image_url && (
                                    <div className="aspect-video md:aspect-auto">
                                        <img
                                            src={featuredPost.cover_image_url}
                                            alt={featuredPost.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-6 md:p-8 flex flex-col justify-center">
                                    {featuredPost.category && (
                                        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-3 w-fit">
                                            {featuredPost.category.name}
                                        </span>
                                    )}
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{featuredPost.title}</h2>
                                    {featuredPost.subtitle && (
                                        <p className="text-slate-600 mb-4">{featuredPost.subtitle}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <span>{formatDate(featuredPost.published_at)}</span>
                                        <span>•</span>
                                        <span>{featuredPost.reading_time_minutes} min lettura</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </section>

            {/* Category Filters */}
            <section className="border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === 'all'
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
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Posts Grid */}
            <section className="py-12">
                <div className="max-w-6xl mx-auto px-6">
                    {regularPosts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            Nessun articolo in questa categoria
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {regularPosts.map(post => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    {post.cover_image_url && (
                                        <div className="aspect-video overflow-hidden">
                                            <img
                                                src={post.cover_image_url}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        {post.category && (
                                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded mb-2">
                                                {post.category.name}
                                            </span>
                                        )}
                                        <h3 className="font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                            {post.title}
                                        </h3>
                                        {post.subtitle && (
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-3">{post.subtitle}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>{formatDate(post.published_at)}</span>
                                            <span>•</span>
                                            <span>{post.reading_time_minutes} min</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-100 py-8">
                <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} IDONEO - La piattaforma per prepararti ai concorsi pubblici
                </div>
            </footer>
        </div>
    );
}
