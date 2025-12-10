import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { BlogPost } from '@/types/blog';

// ================== TYPES ==================

interface BlogCardProps {
    key?: React.Key;
    post: BlogPost;
    className?: string;
}

// ================== SUB-COMPONENTS ==================

function BlogCard({ post, className = '' }: BlogCardProps) {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className={`group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all ${className}`}
        >
            {/* Background Image */}
            {post.cover_image_url ? (
                <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
            )}

        </Link>
    );
}

function BlogHeroSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 lg:h-56 bg-slate-200 rounded-2xl animate-pulse" />
                ))}
            </div>
            {/* Mobile */}
            <div className="md:hidden">
                <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
            </div>
        </div>
    );
}

// ================== MAIN COMPONENT ==================

export default function BlogHero() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('blog_posts')
                    .select('id, slug, title, subtitle, cover_image_url')
                    .eq('status', 'published')
                    .order('published_at', { ascending: false })
                    .limit(3);

                if (fetchError) throw fetchError;
                if (data) setPosts(data);
            } catch (err) {
                console.error('Failed to fetch blog posts:', err);
                setError('Impossibile caricare gli articoli');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) return <BlogHeroSkeleton />;
    if (error) return null; // Silently fail for non-critical component
    if (posts.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center px-1">
                <h2 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                    📰 Blog & Novità
                </h2>
                <Link
                    to="/blog"
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                    Vedi tutti
                </Link>
            </div>

            {/* Desktop: Grid Layout (hidden on mobile) */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(post => (
                    <BlogCard
                        key={post.id}
                        post={post}
                        className="h-48 lg:h-56"
                    />
                ))}
            </div>

            {/* Mobile: Horizontal Scroll Carousel (hidden on desktop) */}
            <div className="md:hidden -mx-4 px-4">
                <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {posts.map(post => (
                        <BlogCard
                            key={post.id}
                            post={post}
                            className="flex-shrink-0 w-[85vw] h-48 snap-center"
                        />
                    ))}
                    {/* Right padding spacer */}
                    <div className="flex-shrink-0 w-4" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}
