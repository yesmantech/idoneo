import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/types/blog';

interface BlogCarouselProps {
    posts: BlogPost[];
}

// Configuration handles responsive alignment to match other sections
const GAP_MOBILE = 12;
const GAP_DESKTOP = 24;

export default function BlogCarousel({ posts }: BlogCarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Update dimensions on mount and resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
                setIsMobile(window.innerWidth < 768);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const gap = isMobile ? GAP_MOBILE : GAP_DESKTOP;

    // "Native Alignment" Logic:
    // We synchronize the carousel's start with the app's global container (max-w-7xl).
    // Search Bar and RecentlyUsed use px-4 (16px) on mobile and px-8 (32px) on desktop.

    const leftMargin = useMemo(() => {
        if (isMobile) return 16;

        // On desktop, Sections are max-w-7xl (1280px) and centered.
        // We calculate the gutter and add the 32px inner padding.
        const gutter = Math.max(0, (containerWidth - 1280) / 2);
        return gutter + 32;
    }, [containerWidth, isMobile]);

    // Peek defines how much of the next card is visible (sliver peek)
    const rightPeek = isMobile ? 28 : (containerWidth > 1440 ? 400 : 200);

    const cardWidth = useMemo(() => {
        if (containerWidth === 0) return 300; // SSR/Initial fallback

        if (isMobile) {
            // Width = Viewport - Margin - Gap - SliverPeek
            return containerWidth - leftMargin - gap - rightPeek;
        }

        // On desktop, it fills the remaining container space or a fixed max
        const available = containerWidth - leftMargin - rightPeek;
        return Math.min(1000, Math.max(280, available));
    }, [containerWidth, isMobile, leftMargin, rightPeek, gap]);

    return (
        <div className="relative w-full group/carousel">
            <div
                ref={containerRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 pt-2 relative z-10"
                style={{
                    scrollBehavior: 'smooth',
                    gap: `${gap}px`,
                    paddingLeft: `${leftMargin}px`,
                    paddingRight: `${leftMargin}px`,
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {posts.map((post, index) => (
                    <CarouselItem
                        key={post.id}
                        post={post}
                        cardWidth={cardWidth}
                        priority={index < 4}
                    />
                ))}
            </div>
        </div>
    );
}

// ================== INDIVIDUAL CARD ITEM ==================

interface CarouselItemProps {
    post: BlogPost;
    cardWidth: number;
    priority: boolean;
}

function CarouselItem({ post, cardWidth, priority }: CarouselItemProps) {
    return (
        <div
            className="snap-start shrink-0 relative flex flex-col items-center justify-center p-0"
            style={{ width: `${cardWidth}px` }}
        >
            <Link
                to={`/blog/${post.slug}`}
                className="block w-full relative overflow-hidden rounded-[28px] md:rounded-[32px] 
                           shadow-lg transition-all duration-300 ease-out 
                           active:scale-[0.98] bg-white dark:bg-slate-800 
                           border border-slate-100 dark:border-slate-700/50 group"
                style={{ aspectRatio: '16 / 9' }}
            >
                {/* Image */}
                <div className="absolute inset-0 w-full h-full">
                    {post.cover_image_url ? (
                        <img
                            src={post.cover_image_url}
                            alt={post.title}
                            loading={priority ? "eager" : "lazy"}
                            decoding="async"
                            // @ts-ignore
                            fetchpriority={priority ? "high" : "auto"}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                </div>

                {/* Content Overlay - Aligned to reference */}
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end items-start gap-1 md:gap-3">
                    {/* Optional Tag (e.g., Refreshed!) */}
                    {post.category?.name && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900/40 backdrop-blur-md text-white text-[10px] md:text-xs font-black uppercase tracking-wider mb-1 border border-white/20">
                            {post.category.name}
                        </span>
                    )}

                    <h3 className="text-xl md:text-3xl font-extrabold text-white line-clamp-2 leading-tight drop-shadow-lg">
                        {post.title}
                    </h3>

                    <p className="hidden md:block text-slate-200/90 text-sm font-medium line-clamp-2 mt-1">
                        {post.subtitle}
                    </p>
                </div>
            </Link>
        </div>
    );
}
