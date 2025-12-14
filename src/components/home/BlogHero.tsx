import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { BlogPost } from '@/types/blog';
import { Sparkles } from 'lucide-react';

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

    // Skeleton matches the dimensions
    if (loading) {
        return (
            <div className="w-full flex items-center justify-center" style={{ height: '210px' }}>
                <div
                    className="bg-slate-200 animate-pulse rounded-[24px]"
                    style={{
                        width: 'calc((100vw - 32px) * 0.88)',
                        height: '180px'
                    }}
                />
            </div>
        );
    }

    if (posts.length === 0) return null;

    return (
        <div
            className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide flex items-center"
            style={{
                height: '210px',
                // Center the active card: 
                // Side padding = (100vw - CardWidth) / 2
                // We use calc directly in style to ensure precision
                paddingLeft: 'calc((100vw - ((100vw - 32px) * 0.88)) / 2)',
                paddingRight: 'calc((100vw - ((100vw - 32px) * 0.88)) / 2)',
                gap: '20px', // Gap to fine-tune the peek
            }}
        >
            {posts.map((post, index) => (
                <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="flex-shrink-0 relative overflow-hidden snap-center transition-transform duration-300 group"
                    style={{
                        width: 'calc((100vw - 32px) * 0.88)',
                        height: '180px',
                        borderRadius: '24px',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    {/* Background: Image or Generative Gradients via "Gems" */}
                    {post.cover_image_url ? (
                        <>
                            <img
                                src={post.cover_image_url}
                                alt={post.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Dark Gradient Overlay for readability on images */}
                            <div
                                className="absolute inset-0"
                                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%)' }}
                            />
                        </>
                    ) : (
                        <>
                            {/* Intense multi-color gradient (Shuffle style) */}
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

                            {/* GEM/CRYSTAL SHAPES */}
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

                            {/* Subtle noise texture overlay */}
                            <div
                                className="absolute inset-0"
                                style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 60%)' }}
                            />
                        </>
                    )}

                    {/* Content Layer */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                        {/* Glassmorphic Tag */}
                        <div
                            className="self-start flex items-center gap-1.5"
                            style={{
                                padding: '6px 10px 6px 8px',
                                borderRadius: '20px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-white" fill="white" />
                            <span
                                className="uppercase font-extrabold tracking-wider text-white"
                                style={{ fontSize: '10px', letterSpacing: '0.8px' }}
                            >
                                {(post.category as any)?.name || 'Novità'}
                            </span>
                        </div>

                        {/* Typography */}
                        <div>
                            <h3
                                className="text-white font-black leading-none mb-2 line-clamp-2"
                                style={{
                                    fontSize: '22px',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                                }}
                            >
                                {post.title}
                            </h3>
                            {post.subtitle && (
                                <p
                                    className="text-white/90 font-medium line-clamp-1"
                                    style={{
                                        fontSize: '13px',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {post.subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

