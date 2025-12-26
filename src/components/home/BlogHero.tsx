import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { BlogPost } from '@/types/blog';

// ================== FEATURED CARD (Large 16:9) ==================

interface FeaturedCardProps {
    post: BlogPost;
}

function FeaturedCard({ post }: FeaturedCardProps) {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className="block relative overflow-hidden rounded-[24px] group"
            style={{
                aspectRatio: '16 / 9',
            }}
        >
            {/* Background Image */}
            {post.cover_image_url ? (
                <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                    sizes="(max-width: 768px) 100vw, 66vw"
                />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, #00B1FF 0%, #0891B2 30%, #10B981 70%, #22C55E 100%)`
                    }}
                />
            )}
        </Link>
    );
}

// ================== SMALL CARD (16:9 Thumbnail) ==================

interface SmallCardProps {
    post: BlogPost;
    key?: React.Key;
}

function SmallCard({ post }: SmallCardProps) {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className="block relative overflow-hidden rounded-[16px] group"
            style={{
                aspectRatio: '16 / 9',
            }}
        >
            {/* Background Image */}
            {post.cover_image_url ? (
                <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, #0891B2 0%, #00B1FF 50%, #10B981 100%)`
                    }}
                />
            )}
        </Link>
    );
}

// ================== SKELETON ==================

function BlogHeroSkeleton() {
    return (
        <section className="px-4 md:px-8 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Featured skeleton */}
                    <div className="lg:col-span-2">
                        <div
                            className="bg-slate-200 animate-pulse rounded-[24px]"
                            style={{ aspectRatio: '16 / 9' }}
                        />
                    </div>
                    {/* Small cards skeleton */}
                    <div className="flex flex-col gap-4">
                        <div
                            className="bg-slate-200 animate-pulse rounded-[16px]"
                            style={{ aspectRatio: '16 / 9' }}
                        />
                        <div
                            className="bg-slate-200 animate-pulse rounded-[16px]"
                            style={{ aspectRatio: '16 / 9' }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

// ================== MAIN COMPONENT ==================

export default function BlogHero() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data } = await supabase
                    .from('blog_posts')
                    .select('id, slug, title, subtitle, cover_image_url, category:blog_categories(name)')
                    .eq('status', 'published')
                    .order('is_featured', { ascending: false })
                    .order('published_at', { ascending: false })
                    .limit(5);

                if (data) setPosts(data as unknown as BlogPost[]);
            } catch (err) {
                console.error('Failed to fetch blog posts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) return <BlogHeroSkeleton />;
    if (posts.length === 0) return null;

    const featuredPost = posts[0];
    const secondaryPosts = posts.slice(1, 3);

    return (
        <section className="px-4 py-6 md:py-10 pt-safe">
            <div className="max-w-7xl mx-auto">
                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Featured (2/3 width on desktop) */}
                    <div className="lg:col-span-2">
                        <FeaturedCard post={featuredPost} />
                    </div>

                    {/* Secondary Cards (1/3 width, stacked) */}
                    <div className="flex flex-col gap-4">
                        {secondaryPosts.map((post) => (
                            <SmallCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
