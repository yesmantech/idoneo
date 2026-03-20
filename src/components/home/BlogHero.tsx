import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BlogPost } from '@/types/blog';
import BlogCarousel from './BlogCarousel';

// ================== SKELETON ==================

function BlogHeroSkeleton() {
    return (
        <section className="px-4 md:px-8 py-8 overflow-hidden">
            <div className="max-w-7xl mx-auto flex gap-6 overflow-hidden">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="shrink-0 w-[320px] h-[180px] bg-slate-200 dark:bg-[#111] animate-pulse rounded-[28px]"
                    />
                ))}
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
                    .limit(8);

                const fetchedPosts = (data as unknown as BlogPost[]) || [];
                setPosts(fetchedPosts);
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

    return (
        <section className="w-full pt-[max(1.5rem,var(--safe-area-top))] bg-slate-50/50 dark:bg-black/50 overflow-hidden">
            <BlogCarousel posts={posts} />
        </section>
    );
}

