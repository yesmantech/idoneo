import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { BlogPost } from '@/types/blog';
import { ChevronRight } from 'lucide-react';

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
            className={`group relative overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-200/50 
                        hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300 ${className}`}
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
                <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5F5] to-slate-200" />
            )}

            {/* Overlay with title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] uppercase font-bold text-[#00B1FF] tracking-wider mb-1">
                    Blog
                </p>
                <h3 className="text-white font-bold text-sm md:text-base leading-snug line-clamp-2">
                    {post.title}
                </h3>
            </div>
        </Link>
    );
}

function BlogHeroSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-[#F5F5F5] rounded-xl animate-pulse" />
                <div className="h-4 w-20 bg-[#F5F5F5] rounded-xl animate-pulse" />
            </div>
            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 lg:h-56 bg-[#F5F5F5] rounded-2xl animate-pulse" />
                ))}
            </div>
            {/* Mobile */}
            <div className="md:hidden">
                <div className="h-48 bg-[#F5F5F5] rounded-2xl animate-pulse" />
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
    if (error) return null;
    if (posts.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-slate-900">
                    📰 Blog & Novità
                </h2>
                <Link
                    to="/blog"
                    className="text-sm font-semibold text-[#00B1FF] hover:text-[#0099e6] transition-colors flex items-center gap-1"
                >
                    Vedi tutti
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(post => (
                    <BlogCard
                        key={post.id}
                        post={post}
                        className="h-48 lg:h-56"
                    />
                ))}
            </div>

            {/* Mobile: Horizontal Scroll Carousel */}
            <div className="md:hidden -mx-5 px-5">
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                    {posts.map(post => (
                        <BlogCard
                            key={post.id}
                            post={post}
                            className="flex-shrink-0 w-[80vw] h-44 snap-center"
                        />
                    ))}
                    {/* Right padding spacer */}
                    <div className="flex-shrink-0 w-4" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}

